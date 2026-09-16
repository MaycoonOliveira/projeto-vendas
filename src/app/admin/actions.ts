"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { assertAuthConfigured, auth } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export type LoginState = { error?: string };

/**
 * Login (Server Action). Mensagens SEMPRE genéricas (anti-enumeração). O cookie de sessão é
 * setado pelo plugin `nextCookies` do Better Auth. `redirect()` fica fora do try (lança
 * NEXT_REDIRECT). A autorização real do painel é feita pela DAL.
 */
export async function signInAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  assertAuthConfigured();

  const parsed = LoginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: "E-mail ou senha inválidos." };
  }

  try {
    await auth.api.signInEmail({
      body: parsed.data,
      headers: await headers(),
    });
  } catch (error) {
    const statusCode = (error as { statusCode?: number })?.statusCode;
    if (statusCode === 429) {
      return { error: "Muitas tentativas. Tente novamente em alguns minutos." };
    }
    return { error: "E-mail ou senha inválidos." };
  }

  const requested = String(formData.get("redirect") ?? "");
  redirect(requested.startsWith("/admin") ? requested : "/admin");
}

/** Logout: revoga a sessão (Better Auth deleta no DB) e volta ao login. */
export async function signOutAction(): Promise<void> {
  assertAuthConfigured();
  await auth.api.signOut({ headers: await headers() });
  redirect("/admin/login");
}
