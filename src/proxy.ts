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

/**
 * CSP do site público (marketing), aplicada SÓ em produção — em dev o HMR do Next usa `eval`
 * e scripts inline que uma CSP estrita quebraria. Sem nonce (o header é adicionado na borda,
 * sem ler `headers()`), então as páginas continuam ESTÁTICAS.
 *
 * `script-src`/`style-src` incluem `'unsafe-inline'`: o App Router injeta scripts/estilos inline
 * de bootstrap/hydration e não há entrada de HTML do usuário nessas páginas (React já escapa) —
 * o ganho aqui é de defesa em profundidade (object-src, base-uri, form-action, frame-ancestors,
 * connect-src travados). `frame-src` libera só o embed do Google Maps.
 */
const MARKETING_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  // `*.supabase.co`: fotos das acomodações servidas pelo Supabase Storage (bucket público).
  // Só imagens (não executam) — o host do projeto é derivado da chave, por isso o wildcard.
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-src https://www.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  "upgrade-insecure-requests",
].join("; ");

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
    // IMPORTANTE (anti-loop): NÃO redirecionamos "cookie presente + rota pública → /admin" aqui.
    // `getSessionCookie` só confirma a EXISTÊNCIA do cookie, não sua validade no DB. Um cookie
    // obsoleto (sessão expirada/revogada, banco recriado em dev) faria: /admin → DAL manda p/
    // login → proxy manda de volta p/ /admin → loop (NotAllowedRootHTTPFallbackError). A cortesia
    // de "já logado pula o login" é feita na PÁGINA de login, com checagem REAL no DB (sem loop).

    // CSP estrita baseada em nonce — SÓ em produção. Em dev, a CSP (nonce/strict-dynamic e,
    // sobretudo, `upgrade-insecure-requests`) quebra o carregamento dos scripts do Next em
    // http://localhost e o tooling/HMR — então em dev mantemos apenas os demais headers.
    if (!isDev) {
      const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
      const csp = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
        // `style-src` com `'unsafe-inline'` (sem nonce): nonce NÃO cobre atributos `style=`, e o
        // React 19 aplica estilos inline (reveal do Suspense, barras/larguras calculadas etc.).
        // Com nonce e sem `'unsafe-inline'`, o navegador bloqueava esses estilos e as páginas do
        // admin ficavam presas no skeleton "Carregando…". A proteção contra XSS vive no `script-src`
        // (nonce + strict-dynamic); estilo inline é risco baixo (React escapa; sem HTML do usuário).
        "style-src 'self' 'unsafe-inline'",
        // `*.supabase.co`: fotos das acomodações (Supabase Storage, bucket público) na galeria admin.
        "img-src 'self' blob: data: https://*.supabase.co",
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

  // Marketing (estático): headers de segurança + CSP em produção (dev fica sem CSP p/ HMR).
  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  if (isProd) {
    res.headers.set("Content-Security-Policy", MARKETING_CSP);
  }
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
