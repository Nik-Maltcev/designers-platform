/**
 * Сбор ссылок на отзывы о студиях с площадок.
 *
 * 1. Brave Search — ищем студию на площадках с отзывами
 * 2. Сохраняем ссылки, рейтинги, количество отзывов в ReviewSummary
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const BRAVE_KEY = process.env.BRAVE_SEARCH_API_KEY;

if (!BRAVE_KEY) {
  console.error("❌ BRAVE_SEARCH_API_KEY не задан в .env");
  process.exit(1);
}

const PLATFORMS = [
  { domain: "yandex.ru/maps", name: "Яндекс Карты", icon: "🗺️" },
  { domain: "2gis.ru", name: "2ГИС", icon: "📍" },
  { domain: "houzz.ru", name: "Houzz", icon: "🏠" },
  { domain: "inmyroom.ru", name: "InMyRoom", icon: "🛋️" },
  { domain: "roomble.com", name: "Roomble", icon: "🪑" },
  { domain: "zoon.ru", name: "Zoon", icon: "⭐" },
  { domain: "otzovik.com", name: "Отзовик", icon: "💬" },
  { domain: "irecommend.ru", name: "iRecommend", icon: "👍" },
  { domain: "flamp.ru", name: "Flamp", icon: "🔥" },
  { domain: "google.com/maps", name: "Google Maps", icon: "📌" },
  { domain: "profi.ru", name: "Профи.ру", icon: "👷" },
  { domain: "remontnik.ru", name: "Ремонтник", icon: "🔧" },
  { domain: "mastercity.ru", name: "MasterCity", icon: "🏗️" },
];

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
      domain: new URL(r.url).hostname,
    }));
  } catch (err) {
    console.log(`  ✗ Brave error: ${err.message}`);
    return [];
  }
}

// --- Extract rating from snippet ---
function extractRating(snippet) {
  // "Рейтинг 4.8 из 5" or "4.8★" or "оценка: 4.5"
  const m = snippet.match(/(?:рейтинг|оценка|rating)[:\s]*(\d[.,]\d)/i)
    || snippet.match(/(\d[.,]\d)\s*(?:из\s*5|★|⭐|\/5)/i)
    || snippet.match(/(\d[.,]\d)\s*\(/);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
}

function extractReviewCount(snippet) {
  const m = snippet.match(/(\d+)\s*(?:отзыв|review|оценк)/i);
  return m ? parseInt(m[1]) : null;
}

function matchPlatform(url, domain) {
  for (const p of PLATFORMS) {
    if (url.includes(p.domain) || domain.includes(p.domain.split("/")[0])) {
      return p;
    }
  }
  return null;
}

// --- Process studio ---
async function processStudio(studio) {
  console.log(`\n→ ${studio.name}`);

  const queries = [
    `"${studio.name}" отзывы`,
    `"${studio.name}" отзывы дизайн интерьера`,
  ];

  const allResults = [];
  for (const q of queries) {
    const results = await braveSearch(q);
    allResults.push(...results);
    await new Promise((r) => setTimeout(r, 1000));
  }

  // Deduplicate by URL
  const seen = new Set();
  const unique = allResults.filter((r) => {
    if (seen.has(r.url)) return false;
    seen.add(r.url);
    return true;
  });

  console.log(`  Найдено ${unique.length} результатов`);

  // Match to platforms
  const sources = [];
  for (const r of unique) {
    const platform = matchPlatform(r.url, r.domain);
    if (!platform) continue;
    // Skip duplicates per platform
    if (sources.some((s) => s.platform === platform.name)) continue;
    sources.push({
      platform: platform.name,
      icon: platform.icon,
      url: r.url,
      rating: extractRating(r.snippet),
      reviewCount: extractReviewCount(r.snippet),
      snippet: r.snippet.slice(0, 200),
    });
  }

  console.log(`  Площадок с отзывами: ${sources.length}`);

  if (sources.length === 0) {
    console.log("  ✗ Не найдено площадок с отзывами");
    return;
  }

  // Calculate average rating from sources that have one
  const ratings = sources.filter((s) => s.rating).map((s) => s.rating);
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const totalReviews = sources.reduce((sum, s) => sum + (s.reviewCount || 0), 0);

  try {
    await prisma.reviewSummary.upsert({
      where: { studioId: studio.id },
      create: {
        studioId: studio.id,
        avgRating,
        totalReviews,
        positives: [],
        negatives: [],
        summary: null,
        tone: null,
        sources,
        rawSearchResults: unique,
      },
      update: {
        avgRating,
        totalReviews,
        sources,
        rawSearchResults: unique,
        fetchedAt: new Date(),
      },
    });

    const ratingStr = avgRating ? `${avgRating.toFixed(1)}/5` : "—";
    console.log(`  ✓ рейтинг: ${ratingStr} | отзывов: ${totalReviews} | площадок: ${sources.length}`);
    sources.forEach((s) => console.log(`    ${s.icon} ${s.platform}: ${s.rating || "—"} (${s.reviewCount || "?"} отзывов) → ${s.url}`));
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
    await new Promise((r) => setTimeout(r, 1500));
  }

  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch(console.error);
