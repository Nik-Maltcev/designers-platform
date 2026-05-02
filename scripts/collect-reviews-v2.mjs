/**
 * Сбор отзывов v2: Brave Search → fetch страниц → DeepSeek V4 извлекает отзывы.
 * 
 * Запуск:
 *   node scripts/collect-reviews-v2.mjs                  — все студии
 *   node scripts/collect-reviews-v2.mjs --limit=10       — первые 10
 *   node scripts/collect-reviews-v2.mjs --skip-existing   — пропустить уже собранные
 *   node scripts/collect-reviews-v2.mjs --studio="Название" — конкретная студия
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const BRAVE_KEY = process.env.BRAVE_SEARCH_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

if (!BRAVE_KEY) { console.error("❌ BRAVE_SEARCH_API_KEY не задан"); process.exit(1); }
if (!DEEPSEEK_KEY) { console.error("❌ DEEPSEEK_API_KEY не задан"); process.exit(1); }

// --- Аргументы ---
const args = process.argv.slice(2);
const limitArg = args.find(a => a.startsWith("--limit="));
const LIMIT = limitArg ? parseInt(limitArg.split("=")[1]) : null;
const SKIP_EXISTING = args.includes("--skip-existing");
const studioArg = args.find(a => a.startsWith("--studio="));
const STUDIO_NAME = studioArg ? studioArg.split("=").slice(1).join("=") : null;

// --- Статистика ---
let stats = { total: 0, success: 0, failed: 0, skipped: 0 };

// --- Brave Search ---
async function braveSearch(query) {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=20&search_lang=ru`;
  try {
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
        "X-Subscription-Token": BRAVE_KEY,
      },
    });
    if (!res.ok) {
      console.log(`  ⚠ Brave ${res.status}: ${res.statusText}`);
      return [];
    }
    const data = await res.json();
    return (data.web?.results || []).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: r.description || "",
    }));
  } catch (err) {
    console.log(`  ✗ Brave: ${err.message}`);
    return [];
  }
}

// --- Fetch страницы ---
async function fetchPageText(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const html = await res.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 25000);
  } catch {
    return null;
  }
}

// --- DeepSeek V4 анализ ---
async function analyzeWithDeepSeek(studioName, searchResults, pages) {
  const context = searchResults
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
    .join("\n\n");

  const pagesText = pages
    .filter((p) => p.text)
    .map((p) => `--- ${p.url} ---\n${p.text}`)
    .join("\n\n");

  const prompt = `Проанализируй результаты поиска и страницы с отзывами о дизайн-студии "${studioName}".

РЕЗУЛЬТАТЫ ПОИСКА:
${context}

СОДЕРЖИМОЕ СТРАНИЦ:
${pagesText || "Нет доступных страниц"}

Задачи:
1. Определи площадки с отзывами (Яндекс Карты, 2ГИС, Houzz, Zoon, Отзовик, Flamp, Google Maps, InMyRoom, Roomble и др.)
2. Извлеки КАЖДЫЙ отдельный отзыв — автор, текст, рейтинг, дата, площадка
3. Составь саммари

Верни ТОЛЬКО валидный JSON (без markdown, без \`\`\`):
{
  "sources": [
    {"platform": "название площадки", "url": "ссылка", "rating": число или null, "reviewCount": число или null}
  ],
  "reviews": [
    {"author": "имя или null", "text": "полный текст отзыва", "rating": число или null, "date": "дата или null", "platform": "площадка"}
  ],
  "avgRating": средний рейтинг или null,
  "totalReviews": общее количество или 0,
  "positives": ["плюс"] — до 5 штук,
  "negatives": ["минус"] — до 5 штук,
  "summary": "Резюме 2-3 предложения",
  "tone": "positive" / "mixed" / "negative"
}

ВАЖНО: извлеки ВСЕ отзывы из текстов страниц И из сниппетов. Каждый отзыв — отдельный объект.
Текст отзывов копируй ДОСЛОВНО, без перефразирования. Саммари — своими словами.`;

  // Retry logic
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "Ты аналитик отзывов. Отвечай ТОЛЬКО валидным JSON без markdown-обёрток." },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 8000,
        }),
      });

      if (res.status === 429) {
        const wait = attempt * 10;
        console.log(`  ⏳ Rate limit, жду ${wait}с (попытка ${attempt}/3)...`);
        await sleep(wait * 1000);
        continue;
      }

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.log(`  ⚠ DeepSeek ${res.status}: ${errText.slice(0, 200)}`);
        if (attempt < 3) { await sleep(5000); continue; }
        return null;
      }

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || "";
      const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (!match) {
        console.log(`  ⚠ Не удалось извлечь JSON (попытка ${attempt}/3)`);
        if (attempt < 3) { await sleep(3000); continue; }
        return null;
      }
      return JSON.parse(match[0]);
    } catch (err) {
      console.log(`  ✗ DeepSeek: ${err.message} (попытка ${attempt}/3)`);
      if (attempt < 3) await sleep(5000);
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// --- Иконки площадок ---
const iconMap = {
  "яндекс": "🗺️", "2гис": "📍", "houzz": "🏠", "inmyroom": "🛋️", "roomble": "🪑",
  "zoon": "⭐", "отзовик": "💬", "irecommend": "👍", "flamp": "🔥", "google": "📌",
  "профи": "👷", "profi": "👷",
};

// --- Обработка одной студии ---
async function processStudio(studio) {
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`→ ${studio.name} (${studio.slug})`);
  stats.total++;

  // Поисковые запросы
  const queries = [
    `"${studio.name}" отзывы`,
    `"${studio.name}" отзывы дизайн интерьера`,
    `"${studio.name}" site:yandex.ru/maps`,
    `"${studio.name}" site:2gis.ru`,
    `"${studio.name}" site:zoon.ru`,
    `"${studio.name}" site:flamp.ru`,
    `"${studio.name}" site:otzovik.com`,
    `"${studio.name}" site:houzz.ru`,
    `"${studio.name}" site:inmyroom.ru`,
  ];

  const allResults = [];
  for (const q of queries) {
    const results = await braveSearch(q);
    allResults.push(...results);
    await sleep(1100); // Brave rate limit
  }

  // Дедупликация
  const seen = new Set();
  const unique = allResults.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  console.log(`  🔍 Найдено ${unique.length} уникальных результатов`);
  if (unique.length === 0) {
    console.log("  ✗ Нет результатов поиска");
    stats.failed++;
    return;
  }

  // Загрузка страниц
  const toFetch = unique.slice(0, 15);
  console.log(`  📥 Загрузка ${toFetch.length} страниц...`);
  const pages = [];
  for (const r of toFetch) {
    const text = await fetchPageText(r.url);
    pages.push({ url: r.url, text });
    await sleep(600);
  }
  const loaded = pages.filter((p) => p.text).length;
  console.log(`  📄 Загружено ${loaded}/${toFetch.length} страниц`);

  // Анализ через DeepSeek
  console.log("  🤖 Анализ через DeepSeek V4...");
  const analysis = await analyzeWithDeepSeek(studio.name, unique, pages);
  if (!analysis) {
    console.log("  ✗ DeepSeek не вернул результат");
    stats.failed++;
    return;
  }

  const sources = (analysis.sources || []).map((s) => {
    const key = Object.keys(iconMap).find((k) => s.platform.toLowerCase().includes(k));
    return { ...s, icon: key ? iconMap[key] : "⭐" };
  });

  const reviews = analysis.reviews || [];

  // Сохранение в БД
  try {
    await prisma.reviewSummary.upsert({
      where: { studioId: studio.id },
      create: {
        studioId: studio.id,
        avgRating: analysis.avgRating || null,
        totalReviews: analysis.totalReviews || 0,
        positives: analysis.positives || [],
        negatives: analysis.negatives || [],
        summary: analysis.summary || null,
        tone: analysis.tone || null,
        sources,
        reviews,
        rawSearchResults: unique,
      },
      update: {
        avgRating: analysis.avgRating || null,
        totalReviews: analysis.totalReviews || 0,
        positives: analysis.positives || [],
        negatives: analysis.negatives || [],
        summary: analysis.summary || null,
        tone: analysis.tone || null,
        sources,
        reviews,
        rawSearchResults: unique,
        fetchedAt: new Date(),
      },
    });

    const rating = analysis.avgRating ? `${analysis.avgRating.toFixed(1)}/5` : "—";
    console.log(`  ✅ ${analysis.tone} | рейтинг: ${rating} | отзывов: ${reviews.length} | площадок: ${sources.length}`);
    sources.forEach((s) => console.log(`    ${s.icon} ${s.platform}: ${s.rating || "—"} → ${s.url}`));
    reviews.slice(0, 3).forEach((r) =>
      console.log(`    💬 ${r.author || "Аноним"}: "${(r.text || "").slice(0, 80)}..."`)
    );
    if (analysis.summary) console.log(`  📝 ${analysis.summary}`);
    stats.success++;
  } catch (err) {
    console.log(`  ✗ DB: ${err.message}`);
    stats.failed++;
  }
}

// --- Main ---
async function main() {
  console.log("🔍 Сбор отзывов v2 (DeepSeek V4)\n");

  let where = {};
  if (STUDIO_NAME) {
    where.name = { contains: STUDIO_NAME, mode: "insensitive" };
  }

  let studios = await prisma.studio.findMany({
    where,
    orderBy: { projectCount: "desc" },
    include: { reviewSummary: true },
  });

  if (SKIP_EXISTING) {
    const before = studios.length;
    studios = studios.filter((s) => !s.reviewSummary);
    console.log(`⏭ Пропуск уже собранных: ${before - studios.length} из ${before}`);
  }

  if (LIMIT) {
    studios = studios.slice(0, LIMIT);
  }

  console.log(`📋 Студий к обработке: ${studios.length}\n`);

  if (studios.length === 0) {
    console.log("Нет студий для обработки.");
    await prisma.$disconnect();
    return;
  }

  for (const studio of studios) {
    await processStudio(studio);
    await sleep(2000); // Пауза между студиями
  }

  console.log(`\n${"━".repeat(40)}`);
  console.log(`📊 Итого:`);
  console.log(`   Всего: ${stats.total}`);
  console.log(`   ✅ Успешно: ${stats.success}`);
  console.log(`   ❌ Ошибки: ${stats.failed}`);
  console.log(`   ⏭ Пропущено: ${stats.skipped}`);
  console.log(`${"━".repeat(40)}\n`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("💥 Критическая ошибка:", err);
  prisma.$disconnect();
  process.exit(1);
});
