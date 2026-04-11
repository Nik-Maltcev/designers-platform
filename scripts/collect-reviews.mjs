/**
 * Сбор отзывов: Brave Search → fetch страниц → DeepSeek извлекает отзывы.
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
      .replace(/\s+/g, " ").trim().slice(0, 12000);
  } catch { return null; }
}

async function analyzeWithDeepSeek(studioName, searchResults, pages) {
  const context = searchResults
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
    .join("\n\n");

  const pagesText = pages
    .filter((p) => p.text)
    .map((p, i) => `--- ${p.url} ---\n${p.text}`)
    .join("\n\n");

  const prompt = `Проанализируй результаты поиска и страницы с отзывами о дизайн-студии "${studioName}".

РЕЗУЛЬТАТЫ ПОИСКА:
${context}

СОДЕРЖИМОЕ СТРАНИЦ:
${pagesText || "Нет"}

Задачи:
1. Определи площадки с отзывами (Яндекс Карты, 2ГИС, Houzz, Zoon, Отзовик, Flamp, Google Maps и др.)
2. Извлеки КАЖДЫЙ отдельный отзыв — автор, текст, рейтинг, дата, площадка
3. Составь саммари

Верни JSON (без markdown):
{
  "sources": [
    {"platform": "название", "url": "ссылка", "rating": число или null, "reviewCount": число или null}
  ],
  "reviews": [
    {"author": "имя или null", "text": "полный текст отзыва", "rating": число или null, "date": "дата или null", "platform": "площадка"}
  ],
  "avgRating": средний рейтинг или null,
  "totalReviews": общее количество или 0,
  "positives": ["плюс"] — до 5,
  "negatives": ["минус"] — до 5,
  "summary": "Резюме 2-3 предложения",
  "tone": "positive" / "mixed" / "negative"
}

ВАЖНО: извлеки ВСЕ отзывы которые найдёшь в текстах страниц. Каждый отзыв отдельным объектом в массиве reviews.`;

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
        temperature: 0.2, max_tokens: 4000,
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

const iconMap = {
  "яндекс": "🗺️", "2гис": "📍", "houzz": "🏠", "inmyroom": "🛋️", "roomble": "🪑",
  "zoon": "⭐", "отзовик": "💬", "irecommend": "👍", "flamp": "🔥", "google": "📌",
  "профи": "👷", "profi": "👷",
};

async function processStudio(studio) {
  console.log(`\n→ ${studio.name}`);

  const r1 = await braveSearch(`"${studio.name}" отзывы`);
  await new Promise((r) => setTimeout(r, 1000));
  const r2 = await braveSearch(`"${studio.name}" отзывы дизайн интерьера`);
  await new Promise((r) => setTimeout(r, 1000));

  const seen = new Set();
  const unique = [...r1, ...r2].filter((r) => { if (seen.has(r.url)) return false; seen.add(r.url); return true; });
  console.log(`  Найдено ${unique.length} результатов`);
  if (unique.length === 0) { console.log("  ✗ Нет результатов"); return; }

  // Fetch more pages for review extraction
  const toFetch = unique.slice(0, 8);
  console.log(`  Загрузка ${toFetch.length} страниц...`);
  const pages = [];
  for (const r of toFetch) {
    const text = await fetchPageText(r.url);
    pages.push({ url: r.url, text });
    await new Promise((r) => setTimeout(r, 500));
  }
  const loaded = pages.filter((p) => p.text).length;
  console.log(`  Загружено ${loaded} страниц`);

  console.log("  Анализ через DeepSeek...");
  const analysis = await analyzeWithDeepSeek(studio.name, unique, pages);
  if (!analysis) { console.log("  ✗ DeepSeek не вернул результат"); return; }

  const sources = (analysis.sources || []).map((s) => {
    const key = Object.keys(iconMap).find((k) => s.platform.toLowerCase().includes(k));
    return { ...s, icon: key ? iconMap[key] : "⭐" };
  });

  const reviews = analysis.reviews || [];

  try {
    await prisma.reviewSummary.upsert({
      where: { studioId: studio.id },
      create: {
        studioId: studio.id, avgRating: analysis.avgRating || null,
        totalReviews: analysis.totalReviews || 0, positives: analysis.positives || [],
        negatives: analysis.negatives || [], summary: analysis.summary || null,
        tone: analysis.tone || null, sources, reviews, rawSearchResults: unique,
      },
      update: {
        avgRating: analysis.avgRating || null, totalReviews: analysis.totalReviews || 0,
        positives: analysis.positives || [], negatives: analysis.negatives || [],
        summary: analysis.summary || null, tone: analysis.tone || null,
        sources, reviews, rawSearchResults: unique, fetchedAt: new Date(),
      },
    });

    const rating = analysis.avgRating ? `${analysis.avgRating.toFixed(1)}/5` : "—";
    console.log(`  ✓ ${analysis.tone} | рейтинг: ${rating} | отзывов: ${reviews.length} текстов | площадок: ${sources.length}`);
    sources.forEach((s) => console.log(`    ${s.icon} ${s.platform}: ${s.rating || "—"} → ${s.url}`));
    reviews.slice(0, 3).forEach((r) => console.log(`    💬 ${r.author || "Аноним"}: "${(r.text || "").slice(0, 80)}..."`));
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
