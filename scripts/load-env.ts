import { loadEnvConfig } from "@next/env";

// Carrega .env.local/.env como o Next (para scripts fora do runtime do Next).
// Importe ESTE módulo ANTES de qualquer módulo que leia env no load (ex.: src/lib/auth).
loadEnvConfig(process.cwd());
