# ADR-0001 — Ciclo de reserva: check-in / check-out

**Status:** Aceito (Fase 8) · **Data:** 2026-09 · **Contexto:** auditoria de produto pediu controle
de check-in/check-out e estados como "hospedada".

## Decisão
Estender a máquina de estados atual **sem inventar estados de pagamento** (pagamento é V2). Estados:

```
PENDING ──confirm──▶ CONFIRMED ──check-in──▶ CHECKED_IN ──check-out──▶ CHECKED_OUT
   │                    │  │                     │
   ├─cancel─▶ CANCELLED │  └─no-show─▶ NO_SHOW   └─(sem retorno)
   └─expire─▶ EXPIRED   └─cancel─▶ CANCELLED
```

- **Novos:** `CHECKED_IN` (hóspede presente), `CHECKED_OUT` (substitui semanticamente `COMPLETED`).
- `COMPLETED` é **mantido** como terminal legado (retrocompatível), mas novos check-outs usam
  `CHECKED_OUT`. Ambos contam como "estadia concluída" nas consultas.
- Transições válidas adicionadas: `CONFIRMED→CHECKED_IN`, `CHECKED_IN→CHECKED_OUT`,
  `CHECKED_IN→NO_SHOW` não (no-show é antes do check-in: `CONFIRMED→NO_SHOW`).
- **Inventário:** CHECKED_IN mantém `occupancy.active` (datas correntes); CHECKED_OUT/COMPLETED as
  datas já passaram → não afetam disponibilidade futura.

## Consequências
- Migration estende o `CHECK` de `reservation.status` para incluir os novos valores (sem quebrar os
  existentes). `RESERVATION_STATUSES` e o mapa de transições são atualizados.
- Dashboard deriva "chegadas/saídas de hoje" das datas de reservas CONFIRMED/CHECKED_IN; as ações
  de check-in/out só aparecem no dia (ou com override do admin).
- **Pagamento** ("pagamento pendente/paga") **não** entra na máquina de estados; será um atributo
  separado via registro de pagamento manual (Fase 8.3) e, no V2, via gateway.

## Alternativas descartadas
- Adicionar estados de pagamento agora → dependeria de pagamentos (V2) e poluiria o domínio.
- Substituir `COMPLETED` por `CHECKED_OUT` com migração de dados → desnecessário; coexistência é
  mais segura.
