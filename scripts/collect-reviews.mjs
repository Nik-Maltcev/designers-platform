/**
 * Сбор и суммаризация отзывов о студиях.
 *
 * Стратегия:
 * 1. Brave Search — ищем "{название студии} отзывы" → получаем URL и сниппеты
 * 2. Fetch страниц с отзывами (Яндекс Карты, 2ГИС, Houzz и т.д.)
 * 3. Gemini суммаризирует: тон, плюсы, минусы, средняя оценка
 * 4. Сохраняем в ReviewSummary
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const BRAVE_KEY = process.env.BRAVE_SEARCH_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

if (!BRAVE_KEY) {
  console.error("❌ BRAVE_SEARCH_API_KEY не задан в .env");
  console.log("Получите ключ на https://brave.com/search/api/ (бесплатно до 2000 запросов/мес)");
  process.exit(1);
}

// --- Brave Search ---
async function braveSearch(query) {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10&search_lang=ru`;
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
      snippet: r.description,
      domain: new URL(r.url).hostname,
    }));
  } catch (err) {
    console.log(`  ✗ Brave error: ${err.message}`);
    return [];
  }
}

// --- Fetch page content ---
const REVIEW_DOMAINS = [
  "yandex.ru", "2gis.ru", "houzz.ru", "inmyroom.ru", "roomble.com",
  "zoon.ru", "otzovik.com", "irecommend.ru", "flamp.ru", "google.com",
];

function isReviewPage(domain) {
  return REVIEW_DOMAINS.some((d) => domain.includes(d));
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
    // Strip HTML tags, collapse whitespace
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000); // Limit for LLM context
  } catch {
    return null;
  }
}

// --- Gemini summarization ---
async function summarizeWithGemini(studioName, searchResults, pageTexts) {
  const context = searchResults
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
    .join("\n\n");

  const pages = pageTexts
    .filter(Boolean)
    .map((t, i) => `--- Страница ${i + 1} ---\n${t}`)
    .join("\n\n");

  const prompt = `Ты — аналитик отзывов. Проанализируй информацию о компании "${studioName}" из поисковой выдачи и страниц с отзывами.

ПОИСКОВАЯ ВЫДАЧА:
${context}

СОДЕРЖИМОЕ СТРАНИЦ С ОТЗЫВАМИ:
${pages || "Не удалось загрузить страницы"}

Верни JSON (без markdown, только чистый JSON):
{
  "avgRating": число от 1 до 5 или null если нет данных,
  "totalReviews": примерное общее количество отзывов или 0,
  "positives": ["плюс 1", "плюс 2", "плюс 3"] — максимум 5 ключевых плюсов,
  "negatives": ["минус 1", "минус 2"] — максимум 5 ключевых минусов,
  "summary": "Краткое резюме отзывов в 2-3 предложениях на русском",
  "tone": "positive" или "mixed" или "negative",
  "sources": [{"platform": "название площадки", "url": "ссылка", "rating": число или null, "reviewCount": число или null}]
}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 2000 },
        }),
      }
    );
    if (!res.ok) {
      console.log(`  ⚠ Gemini ${res.status}`);
      return null;
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.log(`  ✗ Gemini error: ${err.message}`);
    return null;
  }
}

// --- Main ---
async function processStudio(studio) {
  console.log(`\n→ ${studio.name}`);

  // Step 1: Search for reviews
  const query = `"${studio.name}" отзывы дизайн интерьера`;
  const results = await braveSearch(query);
  console.log(`  Найдено ${results.length} результатов`);

  if (results.length === 0) {
    console.log("  ✗ Нет результатов поиска");
    return;
  }

  // Step 2: Fetch review pages (max 3 to stay within limits)
  const reviewUrls = results.filter((r) => isReviewPage(r.domain)).slice(0, 3);
  const otherUrls = results.filter((r) => !isReviewPage(r.domain)).slice(0, 2);
  const toFetch = [...reviewUrls, ...otherUrls].slice(0, 4);

  console.log(`  Загрузка ${toFetch.length} страниц...`);
  const pageTexts = [];
  for (const r of toFetch) {
    const text = await fetchPageText(r.url);
    if (text) pageTexts.push(text);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  console.log(`  Загружено ${pageTexts.length} страниц`);

  // Step 3: Summarize with Gemini
  console.log("  Суммаризация через Gemini...");
  const analysis = await summarizeWithGemini(studio.name, results, pageTexts);

  if (!analysis) {
    console.log("  ✗ Не удалось получить анализ");
    return;
  }

  // Step 4: Save to DB
  try {
    await prisma.reviewSummary.upsert({
      where: { studioId: studio.id },
      create: {
        studioId: studio.id,
        avgRating: analysis.avgRating,
        totalReviews: analysis.totalReviews || 0,
        positives: analysis.positives || [],
        negatives: analysis.negatives || [],
        summary: analysis.summary,
        tone: analysis.tone,
        sources: analysis.sources || [],
        rawSearchResults: results,
      },
      update: {
        avgRating: analysis.avgRating,
        totalReviews: analysis.totalReviews || 0,
        positives: analysis.positives || [],
        negatives: analysis.negatives || [],
        summary: analysis.summary,
        tone: analysis.tone,
        sources: analysis.sources || [],
        rawSearchResults: results,
        fetchedAt: new Date(),
      },
    });

    const rating = analysis.avgRating ? `${analysis.avgRating}/5` : "—";
    console.log(`  ✓ ${analysis.tone} | рейтинг: ${rating} | отзывов: ${analysis.totalReviews} | источников: ${(analysis.sources || []).length}`);
    if (analysis.summary) console.log(`  📝 ${analysis.summary}`);
  } catch (err) {
    console.log(`  ✗ DB: ${err.message}`);
  }
}

async function main() {
  const studios = await prisma.studio.findMany({
    orderBy: { projectCount: "desc" },
  });

  console.log(`\n🔍 Сбор отзывов для ${studios.length} студий...\n`);

  for (const studio of studios) {
    await processStudio(studio);
    // Rate limit: 1 req/sec for Brave free tier
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
