/**
 * Полный пайплайн: парсинг → отзывы → обогащение Checkko → обогащение DataNewton
 * 
 * Использование:
 *   node scripts/pipeline.js              — все студии
 *   PARSE_LIMIT=10 node scripts/pipeline.js — первые 10
 */

import { execFileSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const steps = [
  { name: "Парсинг студий", script: "scripts/parse-studios.js" },
  { name: "Сбор отзывов (Brave + Gemini)", script: "scripts/collect-reviews.mjs" },
  { name: "Обогащение Checkko", script: "scripts/enrich-checkko.js" },
  { name: "Обогащение DataNewton", script: "scripts/enrich-datanewton.js" },
];

for (const step of steps) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🚀 ${step.name}`);
  console.log(`${"=".repeat(60)}\n`);
  try {
    execFileSync("node", [step.script], {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env },
    });
    console.log(`\n✅ ${step.name} — готово`);
  } catch (err) {
    console.error(`\n❌ ${step.name} — ошибка (код ${err.status})`);
    console.log("Продолжаем следующий шаг...\n");
  }
}

console.log(`\n${"=".repeat(60)}`);
console.log("🏁 Пайплайн завершён!");
console.log(`${"=".repeat(60)}\n`);
