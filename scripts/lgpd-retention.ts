import "./load-env";

import { getSql } from "../src/db";

/**
 * Rotina de RETENÇÃO / ANONIMIZAÇÃO de dados pessoais (LGPD — Fase 14).
 *
 * Princípio (ver docs/security/LGPD.md §5): a RESERVA nunca é apagada (muda de status), mas a PII
 * do hóspede é minimizada ao fim do prazo de retenção. Esta rotina anonimiza a PII de hóspedes
 * cujas reservas já se encerraram há mais que a janela de retenção e que não têm nenhuma reserva
 * ativa/futura — preservando os registros de reserva (datas, valores, status) para fins fiscais e
 * estatísticos, sem os dados pessoais.
 *
 * Uso:
 *   npm run lgpd:retention              # DRY-RUN (só relata candidatos; nada muda)
 *   npm run lgpd:retention -- --apply   # aplica a anonimização
 *   npm run lgpd:retention -- --months=36 --apply
 *   (ou defina LGPD_RETENTION_MONTHS)
 *
 * Janela padrão: 60 meses (5 anos) — alinha com prazos fiscais/contratuais comuns de hospedagem.
 * ⚠️ Confirmar o prazo definitivo com o responsável pelos dados/jurídico antes do PROD.
 */
function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const found = process.argv.find((a) => a.startsWith(prefix));
  return found ? found.slice(prefix.length) : undefined;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const months = Number(
    arg("months") ?? process.env.LGPD_RETENTION_MONTHS ?? "60",
  );
  if (!Number.isFinite(months) || months <= 0) {
    console.error("--months inválido (use um inteiro positivo).");
    process.exitCode = 1;
    return;
  }

  const sql = getSql();
  const ANON_EMAIL = "anon+%@anonimizado.invalid";

  // Candidatos: sem reserva ativa/futura (PENDING/CONFIRMED/CHECKED_IN) e cujo encerramento
  // (última saída, ou o cadastro se nunca reservou) é anterior ao corte. Já anonimizados são ignorados.
  const candidates = await sql<
    {
      id: string;
      full_name: string;
      last_checkout: string | null;
      res_count: number;
      msg_count: number;
    }[]
  >`
    SELECT
      g.id,
      g.full_name,
      (SELECT max(r.check_out) FROM reservation r WHERE r.guest_id = g.id) AS last_checkout,
      (SELECT count(*)::int FROM reservation r WHERE r.guest_id = g.id) AS res_count,
      (SELECT count(*)::int FROM guest_message m WHERE m.guest_id = g.id) AS msg_count
    FROM guest g
    WHERE g.email NOT LIKE ${ANON_EMAIL}
      AND NOT EXISTS (
        SELECT 1 FROM reservation r
        WHERE r.guest_id = g.id
          AND r.status IN ('PENDING','CONFIRMED','CHECKED_IN')
      )
      AND (
        (EXISTS (SELECT 1 FROM reservation r WHERE r.guest_id = g.id)
          AND (SELECT max(r.check_out) FROM reservation r WHERE r.guest_id = g.id)
              < (current_date - make_interval(months => ${months})))
        OR
        (NOT EXISTS (SELECT 1 FROM reservation r WHERE r.guest_id = g.id)
          AND g.created_at < (now() - make_interval(months => ${months})))
      )
    ORDER BY last_checkout NULLS FIRST
  `;

  console.log(
    `Janela de retenção: ${months} meses. Modo: ${apply ? "APLICAR" : "DRY-RUN (nada muda)"}.`,
  );
  console.log(`Hóspedes elegíveis para anonimização: ${candidates.length}`);
  for (const c of candidates.slice(0, 20)) {
    console.log(
      `  - ${c.id} | reservas=${c.res_count} última_saída=${c.last_checkout ?? "—"} mensagens=${c.msg_count}`,
    );
  }
  if (candidates.length > 20) console.log(`  … +${candidates.length - 20}`);

  if (!apply || candidates.length === 0) {
    if (!apply && candidates.length > 0) {
      console.log("\nRode novamente com --apply para anonimizar.");
    }
    return;
  }

  let done = 0;
  for (const c of candidates) {
    await sql.begin(async (tx) => {
      await tx`
        UPDATE guest SET
          full_name = 'Hóspede anonimizado',
          email = 'anon+' || id || '@anonimizado.invalid',
          phone = 'anonimizado',
          notes = NULL,
          document_type = NULL,
          document_number = NULL,
          birth_date = NULL,
          updated_at = now()
        WHERE id = ${c.id}
      `;
      await tx`DELETE FROM guest_message WHERE guest_id = ${c.id}`;
      await tx`
        INSERT INTO audit_log (actor_type, action, entity_type, entity_id, metadata)
        VALUES ('SYSTEM', 'GUEST_ANONYMIZED', 'guest', ${c.id},
                jsonb_build_object('retentionMonths', ${months}))
      `;
    });
    done += 1;
  }
  console.log(`\n✅ Anonimizados: ${done} hóspede(s).`);
}

main()
  .catch((e) => {
    console.error("Erro:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await getSql().end().catch(() => {});
    process.exit(process.exitCode ?? 0);
  });
