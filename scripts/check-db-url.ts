/**
 * Diagnóstico SEGURO das strings de conexão (não vaza o segredo).
 * Roda no pipeline antes das migrations para transformar o opaco "Invalid URL" em algo acionável.
 *
 * Uso: tsx scripts/check-db-url.ts   (lê DIRECT_URL e DATABASE_URL do ambiente)
 */
function diagnose(name: string, raw: string | undefined): boolean {
  if (!raw) {
    console.log(`- ${name}: (ausente)`);
    return false;
  }
  const v = raw.trim();
  const facts = {
    length: v.length,
    trimmed_diff: v.length !== raw.length,
    starts_ok: /^postgres(ql)?:\/\//.test(v),
    surrounding_quotes: /^['"]|['"]$/.test(v),
    has_space_inside: /\s/.test(v),
    at_count: (v.match(/@/g) ?? []).length, // deve ser 1
    scheme: v.split("://")[0]?.slice(0, 12) ?? "(sem ://)",
  };
  let valid = false;
  try {
    // eslint-disable-next-line no-new
    new URL(v);
    valid = true;
  } catch {
    valid = false;
  }
  console.log(`- ${name}: valid=${valid}`, JSON.stringify(facts));

  if (!valid) {
    if (facts.surrounding_quotes) console.log(`  → remova as ASPAS ao redor do valor de ${name}.`);
    if (facts.has_space_inside) console.log(`  → há ESPAÇO no meio de ${name} (ex.: prefixo "psql ").`);
    if (!facts.starts_ok) console.log(`  → ${name} deve começar com postgres:// ou postgresql://`);
    if (facts.at_count > 1) console.log(`  → há '@' NÃO codificado na senha de ${name} (URL-encode: @ → %40, # → %23, etc.).`);
  }
  return valid;
}

const direct = diagnose("DIRECT_URL", process.env.DIRECT_URL);
const database = diagnose("DATABASE_URL", process.env.DATABASE_URL);

// A migration usa DIRECT_URL (senão DATABASE_URL). Falha cedo com mensagem clara.
if (!direct && !database) {
  console.error("\nNenhuma string de conexão válida — corrija o(s) secret(s) acima.");
  process.exit(1);
}
console.log("\nOK: há ao menos uma string de conexão válida.");
