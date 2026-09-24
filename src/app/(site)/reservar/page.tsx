import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { Container } from "@/components/ui/container";
import { ReservationFlow } from "./reservation-flow";

export const metadata: Metadata = {
  title: "Reservar",
  description:
    "Consulte a disponibilidade da Casa da Nete em Petrópolis e solicite sua reserva.",
  alternates: { canonical: "/reservar" },
};

export default function ReservarPage() {
  return (
    <>
      <PageHeader
        eyebrow="Reserva"
        title="Consulte disponibilidade e reserve"
        description="Escolha as datas e o número de hóspedes. O valor é calculado automaticamente e a reserva fica pendente enquanto confirmamos o pagamento."
      />
      <section className="py-14 sm:py-18">
        <Container>
          <ReservationFlow />
        </Container>
      </section>
    </>
  );
}
