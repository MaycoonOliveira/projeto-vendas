# ADR-0002 — Autenticação do portal do cliente

**Status:** Proposto (Fase 11) · **Data:** 2026-09 · **Contexto:** a auditoria pede um portal do
cliente ("Minhas reservas"), o que **reabre** a decisão travada do V1 ("hóspede não tem login").

## Decisão (proposta)
Adotar **login sem senha por link mágico (magic link) por e-mail** para o hóspede, **separado** do
Better Auth do admin:

- Reaproveita a tabela `guest` (identidade por e-mail já coletado na reserva). **Não** cria senha de
  hóspede (menos superfície de ataque, menos LGPD).
- Fluxo: hóspede informa e-mail → recebe link com token de uso único/curto (reusar padrão de
  `verification`/Resend) → sessão de hóspede (cookie próprio, escopo `/minhas-reservas`).
- **Isolamento:** sessão de hóspede nunca acessa `/admin`; o admin nunca vira hóspede. DAL separada
  (`verifyGuestSession`), sem compartilhar cookie nem role.
- Portal mostra **apenas as reservas daquele e-mail** (DTO mínimo; sem PII de terceiros).

## Consequências
- Evita a complexidade de um segundo provider de senha; magic link cobre o caso de uso (poucas
  reservas por hóspede).
- Mantém o princípio "coletar o mínimo" (LGPD).
- A página pública `/reserva/{code}` (capability) continua existindo para quem tem o link direto.

## Alternativas descartadas
- Senha para hóspede (Better Auth multi-role) → mais atrito, mais risco, desnecessário no V1.
- Só capability por código (status quo) → não atende "histórico/portal".

> **Bloqueio de decisão:** confirmar com a proprietária se o portal do cliente entra no escopo antes
> do lançamento (P2). Até lá, `/reserva/{code}` supre a consulta individual.
