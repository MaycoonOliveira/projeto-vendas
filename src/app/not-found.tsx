import Link from "next/link";
import { Container } from "@/components/ui/container";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center pt-24">
      <Container className="text-center">
        <p className="eyebrow">Erro 404</p>
        <h1 className="mt-4 text-4xl sm:text-5xl">Página não encontrada</h1>
        <p className="mx-auto mt-4 max-w-md text-muted-foreground">
          O endereço que você procura não existe ou foi movido. Vamos voltar
          para um lugar tranquilo?
        </p>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "primary", size: "lg" }), "mt-8")}
        >
          Voltar ao início
        </Link>
      </Container>
    </section>
  );
}
