import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Artefatos de teste
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
    // Scripts de teste de carga: rodam no binário k6 (globals __ENV/__VU, módulos k6/*),
    // não fazem parte do lint da aplicação.
    "tests/load/**",
  ]),
]);

export default eslintConfig;
