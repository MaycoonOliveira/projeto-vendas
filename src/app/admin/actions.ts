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

const ForgotSchema = z.object({ email: z.email() });
export type ForgotState = { ok?: boolean; error?: string };

/**
 * Solicitar redefinição de senha. Resposta SEMPRE genérica (anti-enumeração): não revela se o
 * e-mail existe. O envio (Resend) só ocorre se o usuário existir (Better Auth).
 */
export async function forgetPasswordAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  assertAuthConfigured();

  const parsed = ForgotSchema.safeParse({ email: String(formData.get("email") ?? "") });
  if (parsed.success) {
    try {
      await auth.api.requestPasswordReset({
        body: { email: parsed.data.email, redirectTo: "/admin/redefinir-senha" },
        headers: await headers(),
      });
    } catch (error) {
      const statusCode = (error as { statusCode?: number })?.statusCode;
      if (statusCode === 429) {
        return { error: "Muitas tentativas. Tente novamente em alguns minutos." };
      }
      // Demais erros: mantém resposta genérica (não vaza existência do e-mail).
    }
  }
  return { ok: true };
}

const ResetSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(12, "A senha deve ter no mínimo 12 caracteres."),
});
export type ResetState = { error?: string };

/** Concluir redefinição com o token do e-mail. Invalida todas as sessões (config do Better Auth). */
export async function resetPasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  assertAuthConfigured();

  const parsed = ResetSchema.safeParse({
    token: String(formData.get("token") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { error: "A senha deve ter no mínimo 12 caracteres." };
  }

  try {
    await auth.api.resetPassword({
      body: { newPassword: parsed.data.password, token: parsed.data.token },
      headers: await headers(),
    });
  } catch {
    return { error: "Link inválido ou expirado. Solicite um novo." };
  }

  redirect("/admin/login?reset=1");
}
