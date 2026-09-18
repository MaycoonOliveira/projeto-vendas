import { redirect } from "next/navigation";

/**
 * Compatibilidade: o caminho padrão do Better Auth para redefinição é `/reset-password/{token}`,
 * mas a nossa página de redefinição é `/admin/redefinir-senha?token=`. Este redirect garante que
 * links nesse formato (e-mails antigos) caiam na página correta.
 */
export const dynamic = "force-dynamic";

export default async function ResetPasswordCompat({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  redirect(`/admin/redefinir-senha?token=${encodeURIComponent(token)}`);
}
