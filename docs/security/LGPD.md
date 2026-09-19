# LGPD — Tratamento de dados do hóspede (Casa Carram)

> Conformidade com a **Lei nº 13.709/2018 (LGPD)**. Princípios: **finalidade, minimização, necessidade,
> transparência e segurança**. Este documento é o guia operacional; a página pública de Política de
> Privacidade deve refletir o que aqui se define.

## 1. Dois níveis de coleta (decisão definitiva)

O sistema separa claramente **RESERVA** (mínimo) de **PRÉ-CHECK-IN** (identificação completa):

- **RESERVA** (`guest` + `reservation`): coleta **mínima** para solicitar/contatar. **Não pede
  CPF/documento** (menos atrito, menos coleta).
- **PRÉ-CHECK-IN** (`guest_profile` + `guest_companion`): identificação completa **só quando necessário**
  (obrigação legal/regulatória de hospedagem), em **etapa separada**, acessível **apenas no painel
  autenticado**.
- **CHECK-IN/FNRH**: arquitetura **preparada** para a futura **FNRH Digital**, **sem coletar/integrar
  agora**.

## 2. Inventário de dados

| Dado | Onde | Necessidade | Finalidade | Base legal | Sensibilidade | Retenção | Proteção adicional |
|---|---|---|---|---|---|---|---|
| Nome completo | `guest` | Sim | identificar reserva/hóspede | execução de contrato | PII comum | X meses pós-checkout **[definir antes do PROD]** | acesso restrito ao admin, auditado |
| E-mail | `guest` | Sim | confirmação/contato | execução de contrato | PII comum | idem | idem |
| Telefone/WhatsApp | `guest` | Sim | contato/cobrança fora do site | execução de contrato | PII comum | idem | idem |
| Datas/dados da reserva | `reservation` | Sim | execução da reserva | execução de contrato | baixa | idem (obrigação fiscal pode exigir +) | — |
| Observações | `guest.notes` | Opcional | pedidos especiais | execução de contrato | **pode conter sensível** se o hóspede escrever | idem | orientar a não coletar sensível; tratar como texto |
| IP (logs de segurança) | logs/`audit_log` | Sim | anti-abuso/fraude | legítimo interesse/segurança | PII | **curta (~90 dias)** | log seguro, acesso restrito |
| Nascimento, nacionalidade, endereço | `guest_profile` | **Quando exigido** (pré-check-in) | obrigação legal de hospedagem | obrigação legal | PII | por finalidade **[definir]** | painel autenticado; nunca via `public_code` |
| Documento (tipo/número) | `guest_profile` | **Quando exigido** | identificação legal | obrigação legal | identificador | por finalidade | proteção reforçada |
| **CPF** | `guest_profile` | **Quando exigido** | identificação legal/fiscal | obrigação legal | identificador | por finalidade | proteção reforçada; acesso mínimo |
| Acompanhantes | `guest_companion` | Quando necessário | hospedagem | obrigação legal | PII | por finalidade | painel autenticado |

## 3. Decisão sobre CPF/documento (justificativa formal)

**Não é "nunca coletar CPF".** Na **reserva**, CPF/documento é **desnecessário** para *hold*, contato ou
execução da reserva → **não é solicitado** (minimização + menor atrito de conversão). No **pré-check-in**,
esses dados podem ser **legalmente exigidos** para hospedagem e são coletados **em etapa separada e só
quando necessário**, com acesso **restrito ao painel autenticado** e proteção reforçada. A arquitetura
(`guest` × `guest_profile`/`guest_companion`) já comporta os campos da **FNRH** sem obrigar coleta
antecipada.

## 4. Exposição e acesso

- **`public_code`** (consulta pública da reserva) expõe **apenas o mínimo** (status, acomodação, datas,
  nº de hóspedes, valor, instruções de pagamento, primeiro nome). **Nunca** e-mail/telefone completos,
  documento, CPF, endereço ou observações.
- **PII completa e documentos**: só no **painel administrativo autenticado** (Better Auth + DAL), com
  auditoria de acesso.

## 5. Retenção, expurgo e direitos do titular

- **Prazo de retenção (V1):** **60 meses (5 anos)** a partir do encerramento da estadia — alinhado a
  prazos fiscais/contratuais comuns de hospedagem. ⚠️ Confirmar com o responsável pelos dados/jurídico
  antes do PROD; o prazo é parametrizável (`--months` / `LGPD_RETENTION_MONTHS`).
- **Rotina de anonimização** (`scripts/lgpd-retention.ts`, via `npm run lgpd:retention`):
  - **Elegível:** hóspede **sem** reserva ativa/futura (`PENDING/CONFIRMED/CHECKED_IN`) e cuja última
    saída (ou o cadastro, se nunca reservou) é anterior ao corte.
  - **Ação:** anonimiza a PII em `guest` (nome → "Hóspede anonimizado", e-mail → `anon+<id>@anonimizado.invalid`,
    telefone/observações/documento/nascimento removidos) e **apaga** as mensagens (`guest_message`);
    a **reserva é preservada** (datas/valores/status — nunca apagada) e o evento vira `audit_log`
    (`GUEST_ANONYMIZED`).
  - **Segurança:** roda em **DRY-RUN por padrão** (só relata; `--apply` executa); cada hóspede em sua
    própria transação. Agendável (Vercel Cron/manual) — sem dependência de cron para correção.
- **Direitos do titular** (acesso, correção, exclusão, portabilidade, informação): processo documentado;
  canal de contato do responsável pelos dados. A exclusão pontual usa a mesma anonimização (preserva o
  registro fiscal da reserva, remove a PII).
- **Consentimento**: aviso de privacidade (página existe). Se, no futuro, houver analytics/marketing,
  incluir **banner de consentimento** e atualizar esta política.

## 6. Segurança dos dados (resumo; ver `SECURITY-ARCHITECTURE.md`)

- Criptografia em trânsito (HTTPS) e em repouso (Supabase). Acesso mínimo (role de banco least-privilege).
- `audit_log` **append-only** para acessos/alterações sensíveis, **sem PII sensível** nos logs.
- Minimização e finalidade aplicadas em todo o fluxo; documentos com proteção adicional quando usados.

## 7. Pendências a resolver antes do PROD

- [x] Prazos de retenção definidos (V1: 60 meses pós-estadia) + rotina de anonimização
      (`scripts/lgpd-retention.ts`). Falta apenas a **confirmação jurídica** do prazo final.
- [ ] Texto final da Política de Privacidade e do responsável pelos dados.
- [ ] Confirmar exigências legais de hospedagem aplicáveis (define quando o pré-check-in é obrigatório).
