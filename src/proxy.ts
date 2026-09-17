import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (Next 16, ex-middleware) — SÓ checagem OTIMISTA + headers de segurança.
 * A autorização real vive na DAL (`verifySession`), próxima dos dados. Nunca confiar só aqui.
 *
 * CSP com nonce força renderização dinâmica → aplicada SÓ em `/admin/**` (sensível/dinâmico).
 * A landing estática recebe apenas os demais headers (CSP de marketing = hardening/Fase 7,
 * precisa de allowlist para Maps/fontes).
 */
const isDev = process.env.NODE_ENV === "development";
const isProd = process.env.NODE_ENV === "production";

function withSecurityHeaders(res: NextResponse): NextResponse {
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  if (isProd) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return res;
}

// Rotas de auth públicas dentro de /admin (não exigem sessão).
const PUBLIC_ADMIN_ROUTES = new Set([
  "/admin/login",
  "/admin/esqueci-senha",
  "/admin/redefinir-senha",
]);

export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  const isPublicAdmin = PUBLIC_ADMIN_ROUTES.has(pathname);

  if (isAdmin) {
    const sessionCookie = getSessionCookie(request);

    // Sem cookie em rota admin protegida → login (otimista; a DAL revalida no DB).
    if (!sessionCookie && !isPublicAdmin) {
      const url = new URL("/admin/login", request.url);
      if (pathname !== "/admin") url.searchParams.set("redirect", pathname);
      return withSecurityHeaders(NextResponse.redirect(url));
    }
    // Com cookie tentando ver uma rota pública de auth → painel.
    if (sessionCookie && isPublicAdmin) {
      return withSecurityHeaders(
        NextResponse.redirect(new URL("/admin", request.url)),
      );
    }

    // CSP estrita baseada em nonce — SÓ em produção. Em dev, a CSP (nonce/strict-dynamic e,
    // sobretudo, `upgrade-insecure-requests`) quebra o carregamento dos scripts do Next em
    // http://localhost e o tooling/HMR — então em dev mantemos apenas os demais headers.
    if (!isDev) {
      const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
      const csp = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        `style-src 'self' 'nonce-${nonce}'`,
        "img-src 'self' blob: data:",
        "font-src 'self'",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests",
      ].join("; ");

      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-nonce", nonce);
      requestHeaders.set("Content-Security-Policy", csp);

      const res = NextResponse.next({ request: { headers: requestHeaders } });
      res.headers.set("Content-Security-Policy", csp);
      res.headers.set("X-Frame-Options", "DENY");
      return withSecurityHeaders(res);
    }

    // dev: sem CSP (tooling livre), mantém anti-clickjacking.
    const res = NextResponse.next();
    res.headers.set("X-Frame-Options", "DENY");
    return withSecurityHeaders(res);
  }

  // Marketing (estático): só headers de segurança; sem CSP por ora.
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  return withSecurityHeaders(res);
}

export const config = {
  matcher: [
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
