/**
 * Фильтрация картинок проектов через GPT-4o-mini Vision.
 * Батчинг: все фото проекта в одном запросе.
 * Трекинг: сохраняет обработанные ID в файл, при перезапуске пропускает.
 * 
 * Запуск: node scripts/filter-images.mjs
 *         node scripts/filter-images.mjs --limit=50
 */
import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_KEY) { console.error("❌ OPENAI_API_KEY не задан"); process.exit(1); }

const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1]) : null;

const PROGRESS_FILE = "/tmp/filter-images-done.json";

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadDone() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return new Set(JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8")));
    }
  } catch {}
  return new Set();
}

function saveDone(doneSet) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify([...doneSet]));
}

async function filterBatch(imageUrls) {
  if (imageUrls.length === 0) return [];

  const content = [
    ...imageUrls.map(url => ({
      type: "image_url",
      image_url: { url, detail: "low" },
    })),
    {
      type: "text",
      text: `There are ${imageUrls.length} images above. For EACH image, determine: is it a photo of an interior, exterior, furniture, architecture, or design project? Answer with a JSON array of ${imageUrls.length} booleans: [true, false, ...] where true = interior/design photo, false = portrait/logo/icon/banner/text/avatar. ONLY JSON array, nothing else.`,
    },
  ];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content }],
        temperature: 0,
        max_tokens: 100,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.log(`    ⚠ GPT ${res.status}: ${err.slice(0, 150)}`);
      return imageUrls; // При ошибке оставляем все
    }

    const data = await res.json();
    const text = (data.choices?.[0]?.message?.content || "").trim();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const flags = JSON.parse(cleaned);

    if (!Array.isArray(flags) || flags.length !== imageUrls.length) {
      console.log(`    ⚠ Неверный формат ответа, оставляем все`);
      return imageUrls;
    }

    return imageUrls.filter((_, i) => flags[i] !== false);
  } catch (err) {
    console.log(`    ✗ ${err.message}`);
    return imageUrls;
  }
}

async function main() {
  const doneSet = loadDone();
  console.log(`📋 Уже обработано ранее: ${doneSet.size}\n`);

  let projects = await prisma.project.findMany({
    where: { imageUrls: { isEmpty: false } },
    include: { studio: true },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  // Пропускаем уже обработанные
  projects = projects.filter(p => !doneSet.has(p.id));

  if (LIMIT) projects = projects.slice(0, LIMIT);

  console.log(`🖼 Фильтрация картинок: ${projects.length} проектов\n`);

  let totalKept = 0, totalRemoved = 0;

  for (let i = 0; i < projects.length; i++) {
    const p = projects[i];
    console.log(`  [${i + 1}/${projects.length}] ${(p.title || "—").slice(0, 40)} (${p.studio?.name?.slice(0, 20) || "—"}) — ${p.imageUrls.length} фото`);

    const kept = await filterBatch(p.imageUrls);
    const removed = p.imageUrls.length - kept.length;

    if (removed > 0) {
      await prisma.project.update({
        where: { id: p.id },
        data: { imageUrls: kept },
      });
      console.log(`    ✓ Оставлено: ${kept.length}, удалено: ${removed}`);
    } else {
      console.log(`    ✓ Все ${kept.length} ок`);
    }

    totalKept += kept.length;
    totalRemoved += removed;

    // Сохраняем прогресс каждые 10 проектов
    doneSet.add(p.id);
    if (i % 10 === 0) saveDone(doneSet);

    await sleep(200);
  }

  saveDone(doneSet);

  console.log(`\n${"━".repeat(40)}`);
  console.log(`✅ Готово!`);
  console.log(`   Оставлено: ${totalKept}`);
  console.log(`   Удалено: ${totalRemoved}`);
  console.log(`${"━".repeat(40)}\n`);
  await prisma.$disconnect();
}

main().catch(console.error);
