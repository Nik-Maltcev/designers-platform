import { PrismaClient } from "@prisma/client";
import fs from "fs";

const prisma = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;

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
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
    const baseUrlObj = new URL(url);
    const imgMatches = html.match(/<img[^>]+src=["']([^"']+)["']/gi) || [];
    // Also grab background images from style attributes
    const bgMatches = html.match(/url\(["']?([^"')]+)["']?\)/gi) || [];
    const allSrcs = [
      ...imgMatches.map((m) => m.match(/src=["']([^"']+)["']/)?.[1]),
      ...bgMatches.map((m) => m.match(/url\(["']?([^"')]+)["']?\)/)?.[1]),
    ].filter(Boolean);
    const images = allSrcs
      .map((src) => {
        if (src.startsWith("//")) return "https:" + src;
        if (src.startsWith("/")) return baseUrlObj.origin + src;
        if (src.startsWith("http")) return src;
        if (src.startsWith("data:")) return null;
        return baseUrlObj.origin + "/" + src;
      })
      .filter(Boolean)
      .filter((src) => !src.includes("logo") && !src.includes("icon") && !src.includes("favicon") && !src.includes(".svg"))
      .filter((src, i, arr) => arr.indexOf(src) === i)
      .slice(0, 15);
    return { text, images };
  } catch {
    return null;
  }
}

async function fetchInnPages(baseUrl) {
  const subpages = ["/contacts", "/about", "/kontakty", "/rekvizity", "/policy", "/oferta", "/requisites", "/contact"];
  let allText = "";
  for (const path of subpages) {
    try {
      const url = baseUrl.replace(/\/+$/, "") + path;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(url, {
        signal: controller.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; ProjektListBot/1.0)" },
      });
      clearTimeout(timeout);
      if (!res.ok) continue;
      const html = await res.text();
      const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      // Look for INN pattern (10 or 12 digits)
      const innMatch = text.match(/ИНН[:\s]*(\d{10,12})/i) || text.match(/инн[:\s]*(\d{10,12})/i) || text.match(/INN[:\s]*(\d{10,12})/i);
      if (innMatch) return innMatch[1];
      allText += " " + text.slice(0, 2000);
    } catch { /* skip */ }
  }
  // Try regex on combined text
  const innMatch = allText.match(/(\d{10})\b/) || allText.match(/(\d{12})\b/);
  return innMatch ? innMatch[1] : null;
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
  "projectLinks": ["ссылки на отдельные страницы проектов из портфолио, до 30 штук"]
}

Если информации нет — оставь пустую строку или пустой массив. projectLinks — это URL страниц отдельных проектов из портфолио/каталога работ.`;

  try {
    const res = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 4000 },
      }),
    });
    const data = await res.json();
    if (data.error) {
      if (data.error.code === 429) {
        console.log("  ⏳ Rate limit, waiting 60s...");
        await new Promise((r) => setTimeout(r, 60000));
        return askGemini(pageText, url); // retry
      }
      throw new Error(data.error.message);
    }
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

  // Also fetch portfolio/projects page for more project links
  let combinedText = page.text;
  let combinedImages = [...page.images];
  const portfolioPaths = ["/portfolio", "/projects", "/works", "/cases", "/proekty", "/raboty"];
  for (const path of portfolioPaths) {
    const portfolioPage = await fetchPage(normalized.replace(/\/+$/, "") + path);
    if (portfolioPage) {
      combinedText += " " + portfolioPage.text;
      combinedImages.push(...portfolioPage.images);
      break; // found portfolio page, no need to check others
    }
  }
  combinedText = combinedText.slice(0, 10000);
  combinedImages = [...new Set(combinedImages)].slice(0, 30);

  const info = await askGemini(combinedText, normalized);
  if (!info || !info.name) {
    console.log(`  ✗ Gemini returned nothing`);
    return;
  }

  // Search for INN on subpages if Gemini didn't find it
  let inn = info.inn || null;
  if (!inn) {
    console.log(`  🔍 Searching INN on subpages...`);
    inn = await fetchInnPages(normalized);
    if (inn) console.log(`  📋 Found INN: ${inn}`);
  }

  const slug = slugify(info.name) || slugify(normalized.replace(/https?:\/\//, ""));

  try {
    // Parse individual project pages
    const projectLinks = (info.projectLinks || []).slice(0, 30);
    const projects = [];
    for (const link of projectLinks) {
      const projectUrl = link.startsWith("http") ? link : normalized.replace(/\/+$/, "") + (link.startsWith("/") ? link : "/" + link);
      const projectPage = await fetchPage(projectUrl);
      if (!projectPage) continue;
      // Extract title from first heading-like text
      const titleMatch = projectPage.text.match(/^(.{5,80}?)[\.\,\—\-\|]/);
      projects.push({
        title: titleMatch ? titleMatch[1].trim() : `Проект ${projects.length + 1}`,
        description: projectPage.text.slice(0, 200).trim(),
        imageUrls: projectPage.images.slice(0, 5),
        year: projectPage.text.match(/20[12]\d/)?.[0] || null,
        objectType: null,
      });
      await new Promise((r) => setTimeout(r, 500));
    }
    // If no project links found, use images from main page as projects
    if (projects.length === 0 && combinedImages.length > 1) {
      for (let i = 0; i < Math.min(combinedImages.length, 20); i++) {
        projects.push({
          title: `Проект ${i + 1}`,
          description: null,
          imageUrls: [combinedImages[i]],
          year: null,
          objectType: null,
        });
      }
    }

    const studio = await prisma.studio.create({
      data: {
        name: info.name,
        slug,
        website: normalized,
        inn: inn,
        description: info.description || null,
        city: info.city || null,
        segment: info.segment || null,
        objectTypes: info.objectTypes || [],
        services: info.services || [],
        imageUrl: combinedImages[0] || null,
        projectCount: projects.length,
        projects: {
          create: projects.map((p) => ({
            title: p.title,
            description: p.description || null,
            year: p.year || null,
            objectType: p.objectType || null,
            imageUrls: p.imageUrls,
          })),
        },
      },
    });
    console.log(`  ✓ saved: ${studio.name} (${projects.length} projects)`);
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
