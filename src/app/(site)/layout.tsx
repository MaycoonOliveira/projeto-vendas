import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { WhatsappFloat } from "@/components/layout/whatsapp-float";

/**
 * Layout do site público (marketing). O chrome (Navbar/Footer/WhatsApp) vive aqui, e NÃO no
 * layout raiz, para que o painel `/admin` tenha seu próprio shell sem esses elementos.
 * O route group `(site)` não altera as URLs.
 */
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-full focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <Navbar />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <Footer />
      <WhatsappFloat />
    </div>
  );
}
