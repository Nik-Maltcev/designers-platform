/**
 * Сбор отзывов: Brave Search → DeepSeek анализирует и распределяет.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const BRAVE_KEY = process.env.BRAVE_SEARCH_API_KEY;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

if (!BRAVE_KEY) { console.error("❌ BRAVE_SEARCH_API_KEY не задан"); process.exit(1); }
if (!DEEPSEEK_KEY) { console.error("❌ DEEPSEEK_API_KEY не задан"); process.exit(1); }

async function braveSearch(query) {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=20&search_lang=ru`;
  try {
    const res = await fetch(url, {
      headers: { "Accept": "application/json", "Accept-Encoding": "gzip", "X-Subscription-Token": BRAVE_KEY },
    });
    if (!res.ok) { console.log(`  ⚠ Brave ${res.status}`); return []; }
    const data = await res.json();
    return (data.web?.results || []).map((r) => ({
      title: r.title, url: r.url, snippet: r.description || "",
    }));
  } catch (err) { console.log(`  ✗ Brave: ${err.message}`); return []; }
}

async function fetchPageText(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const html = await res.text();
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ").trim().slice(0, 8000);
  } catch { return null; }
}

async function analyzeWithDeepSeek(studioName, searchResults, pageTexts) {
  const context = searchResults
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
    .join("\n\n");

  const pages = pageTexts.filter(Boolean).map((t, i) => `--- Страница ${i + 1} ---\n${t}`).join("\n\n");

  const prompt = `Ты анализируешь результаты поиска отзывов о дизайн-студии "${studioName}".

РЕЗУЛЬТАТЫ ПОИСКА:
${context}

СОДЕРЖИМОЕ СТРАНИЦ:
${pages || "Нет загруженных страниц"}

Задача:
1. Определи какие из результатов — это площадки с отзывами (Яндекс Карты, 2ГИС, Houzz, Zoon, Отзовик, Flamp, Google Maps, InMyRoom, Roomble, Профи.ру и любые другие)
2. Извлеки рейтинг и количество отзывов если есть в сниппете или тексте страницы
3. Составь саммари отзывов

Верни JSON (без markdown):
{
  "sources": [
    {"platform": "название площадки", "url": "ссылка на страницу с отзывами", "rating": число или null, "reviewCount": число или null}
  ],
  "avgRating": средний рейтинг или null,
  "totalReviews": общее количество отзывов или 0,
  "positives": ["плюс 1", "плюс 2"] — до 5,
  "negatives": ["минус 1", "минус 2"] — до 5,
  "summary": "Резюме в 2-3 предложениях на русском",
  "tone": "positive" или "mixed" или "negative"
}

Если результат не является площадкой с отзывами — не включай его в sources.
Если отзывов нет совсем — sources пустой массив, summary = null.`;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "Отвечай только валидным JSON без markdown." },
          { role: "user", content: prompt },
        ],
        temperature: 0.2, max_tokens: 2000,
      }),
    });
    if (!res.ok) { console.log(`  ⚠ DeepSeek ${res.status}`); return null; }
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch (err) { console.log(`  ✗ DeepSeek: ${err.message}`); return null; }
}

async function processStudio(studio) {
  console.log(`\n→ ${studio.name}`);

  const results1 = await braveSearch(`"${studio.name}" отзывы`);
  await new Promise((r) => setTimeout(r, 1000));
  const results2 = await braveSearch(`"${studio.name}" отзывы дизайн интерьера`);
  await new Promise((r) => setTimeout(r, 1000));

  const seen = new Set();
  const unique = [...results1, ...results2].filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  console.log(`  Найдено ${unique.length} результатов`);
  if (unique.length === 0) { console.log("  ✗ Нет результатов"); return; }

  // Fetch top pages for context
  const toFetch = unique.slice(0, 5);
  console.log(`  Загрузка ${toFetch.length} страниц...`);
  const pageTexts = [];
  for (const r of toFetch) {
    const text = await fetchPageText(r.url);
    if (text) pageTexts.push(text);
    await new Promise((r) => setTimeout(r, 500));
  }
  console.log(`  Загружено ${pageTexts.length} страниц`);

  console.log("  Анализ через DeepSeek...");
  const analysis = await analyzeWithDeepSeek(studio.name, unique, pageTexts);
  if (!analysis) { console.log("  ✗ DeepSeek не вернул результат"); return; }

  // Add icons to sources
  const iconMap = {
    "яндекс": "🗺️", "2гис": "📍", "houzz": "🏠", "inmyroom": "🛋️", "roomble": "🪑",
    "zoon": "⭐", "отзовик": "💬", "irecommend": "👍", "flamp": "🔥", "google": "📌",
    "профи": "👷", "ремонтник": "🔧", "profi": "👷",
  };
  const sources = (analysis.sources || []).map((s) => {
    const key = Object.keys(iconMap).find((k) => s.platform.toLowerCase().includes(k));
    return { ...s, icon: key ? iconMap[key] : "⭐" };
  });

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
        sources, rawSearchResults: unique,
      },
      update: {
        avgRating: analysis.avgRating || null,
        totalReviews: analysis.totalReviews || 0,
        positives: analysis.positives || [],
        negatives: analysis.negatives || [],
        summary: analysis.summary || null,
        tone: analysis.tone || null,
        sources, rawSearchResults: unique, fetchedAt: new Date(),
      },
    });

    const rating = analysis.avgRating ? `${analysis.avgRating}/5` : "—";
    console.log(`  ✓ ${analysis.tone || "?"} | рейтинг: ${rating} | отзывов: ${analysis.totalReviews || 0} | площадок: ${sources.length}`);
    sources.forEach((s) => console.log(`    ${s.icon} ${s.platform}: ${s.rating || "—"} (${s.reviewCount || "?"}) → ${s.url}`));
    if (analysis.summary) console.log(`  📝 ${analysis.summary}`);
  } catch (err) { console.log(`  ✗ DB: ${err.message}`); }
}

async function main() {
  const studios = await prisma.studio.findMany({ orderBy: { projectCount: "desc" } });
  console.log(`\n🔍 Сбор отзывов для ${studios.length} студий...\n`);
  for (const studio of studios) {
    await processStudio(studio);
    await new Promise((r) => setTimeout(r, 1500));
  }
  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
