import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

const urls = fs.readFileSync("designer.csv", "utf-8")
  .split("\n")
  .map((u) => u.trim())
  .filter(Boolean)
  .filter((u, i, arr) => arr.indexOf(u) === i); // dedupe

function normalizeUrl(url) {
  if (!url.startsWith("http")) url = "https://" + url;
  return url;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function fetchPage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ProjektListBot/1.0)" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const html = await res.text();
    // Strip tags, keep text, limit to 8000 chars for Gemini
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 8000);
    // Extract image URLs
    const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
    const images = imgMatches
      .map((m) => m.match(/src=["']([^"']+)["']/)?.[1])
      .filter(Boolean)
      .filter((src) => src.startsWith("http") && !src.includes("logo") && !src.includes("icon"))
      .slice(0, 10);
    return { text, images };
  } catch {
    return null;
  }
}

async function askGemini(pageText, url) {
  const prompt = `Ты анализируешь сайт дизайн-студии интерьеров. URL: ${url}

Вот текст с сайта:
${pageText}

Верни JSON (без markdown, только чистый JSON):
{
  "name": "Название студии",
  "description": "Краткое описание студии (2-3 предложения)",
  "city": "Город (если найден)",
  "inn": "ИНН (если найден, только цифры)",
  "segment": "premium или medium-plus или medium",
  "objectTypes": ["Квартиры", "Дома", ...],
  "services": ["Дизайн-проект", "Авторский надзор", ...],
  "projects": [
    {
      "title": "Название проекта",
      "description": "Краткое описание",
      "year": "2024",
      "objectType": "Квартира"
    }
  ]
}

Если информации нет — оставь пустую строку или пустой массив. Проекты бери из портфолио если есть.`;

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 2000 },
      }),
    });
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const jsonStr = raw.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (err) {
    console.error(`Gemini error for ${url}:`, err.message);
    return null;
  }
}

async function processStudio(url) {
  const normalized = normalizeUrl(url);
  console.log(`→ ${normalized}`);

  const existing = await prisma.studio.findFirst({ where: { website: normalized } });
  if (existing) {
    console.log(`  ✓ already exists: ${existing.name}`);
    return;
  }

  const page = await fetchPage(normalized);
  if (!page) {
    console.log(`  ✗ failed to fetch`);
    return;
  }

  const info = await askGemini(page.text, normalized);
  if (!info || !info.name) {
    console.log(`  ✗ Gemini returned nothing`);
    return;
  }

  const slug = slugify(info.name) || slugify(normalized.replace(/https?:\/\//, ""));

  try {
    const studio = await prisma.studio.create({
      data: {
        name: info.name,
        slug,
        website: normalized,
        inn: info.inn || null,
        description: info.description || null,
        city: info.city || null,
        segment: info.segment || null,
        objectTypes: info.objectTypes || [],
        services: info.services || [],
        imageUrl: page.images[0] || null,
        projectCount: info.projects?.length || 0,
        projects: {
          create: (info.projects || []).slice(0, 5).map((p, i) => ({
            title: p.title || `Проект ${i + 1}`,
            description: p.description || null,
            year: p.year || null,
            objectType: p.objectType || null,
            imageUrls: page.images.slice(i, i + 2),
          })),
        },
      },
    });
    console.log(`  ✓ saved: ${studio.name} (${info.projects?.length || 0} projects)`);
  } catch (err) {
    console.log(`  ✗ DB error: ${err.message}`);
  }
}

async function main() {
  console.log(`\nПарсинг ${urls.length} студий...\n`);

  for (let i = 0; i < urls.length; i++) {
    await processStudio(urls[i]);
    // Rate limit: 15 req/min for Gemini free tier
    if ((i + 1) % 14 === 0) {
      console.log("\n⏳ Пауза 60 сек (лимит Gemini)...\n");
      await new Promise((r) => setTimeout(r, 60000));
    } else {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log("\n✅ Готово!");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  prisma.$disconnect();
  process.exit(1);
});
