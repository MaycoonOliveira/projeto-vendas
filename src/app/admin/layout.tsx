import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Casa da Nete" },
  robots: { index: false, follow: false },
};

// Todo o /admin é dinâmico (sessão + CSP com nonce). Shell próprio, sem o chrome do site.
export const dynamic = "force-dynamic";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-dvh bg-muted">{children}</div>;
}
