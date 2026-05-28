import { Router } from "express";
import { db } from "@workspace/db";
import { sourcesTable, articlesTable, categoriesTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { fetchRssFeed } from "../lib/rss-fetcher.js";
import { rewriteArticle, isAiAvailable } from "../lib/ai-rewriter.js";

const router = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u0600-\u06FF\s]+/g, (m) => m.trim().replace(/\s+/g, "-"))
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 120);
}

async function fetchAndImportSource(sourceId: number, useAi: boolean) {
  const [source] = await db.select().from(sourcesTable).where(eq(sourcesTable.id, sourceId)).limit(1);
  if (!source || !source.feedUrl) throw new Error("Source not found or no feed URL");

  const items = await fetchRssFeed(source.feedUrl);
  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of items) {
    try {
      if (!item.title || !item.link) { skipped++; continue; }

      // Check duplicate by link stored in content or by slug
      const baseSlug = slugify(item.title);
      const [existing] = await db
        .select({ id: articlesTable.id })
        .from(articlesTable)
        .where(and(
          eq(articlesTable.sourceId, sourceId),
          sql`content LIKE ${'%' + item.link + '%'}`
        ))
        .limit(1);

      if (existing) { skipped++; continue; }

      const lang = source.lang as "ar" | "en";
      let title = item.title;
      let summary = item.description.substring(0, 300);
      let content = `<p>${item.description}</p><p><a href="${item.link}" target="_blank" rel="noopener">المصدر الأصلي / Original Source</a></p>`;
      let metaDescription = item.description.substring(0, 160);
      let keywords: string[] = [];

      if (useAi && isAiAvailable()) {
        try {
          const rewritten = await rewriteArticle(item.title, item.description, lang);
          title = rewritten.title || title;
          summary = rewritten.summary || summary;
          content = rewritten.content + `\n<p><a href="${item.link}" target="_blank" rel="noopener">${lang === "ar" ? "المصدر الأصلي" : "Original Source"}: ${source.name}</a></p>`;
          metaDescription = rewritten.metaDescription || metaDescription;
          keywords = rewritten.keywords || [];
        } catch (aiErr: any) {
          errors.push(`AI rewrite failed for "${item.title}": ${aiErr.message}`);
        }
      }

      const slug = slugify(title) + "-" + Date.now();
      const words = content.split(/\s+/).length;
      const readTime = Math.max(1, Math.ceil(words / 200));

      await db.insert(articlesTable).values({
        title,
        slug,
        summary,
        content,
        imageUrl: item.imageUrl,
        imageAlt: title,
        lang,
        status: "published",
        featured: false,
        breaking: false,
        categoryId: source.categoryId,
        sourceId: source.id,
        tags: keywords.slice(0, 5),
        keywords,
        metaDescription,
        readTime,
        viewCount: 0,
        publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
      });

      added++;
      // small delay to avoid hammering AI
      if (useAi && isAiAvailable()) await new Promise((r) => setTimeout(r, 500));
    } catch (err: any) {
      errors.push(`Failed item "${item.title}": ${err.message}`);
      skipped++;
    }
  }

  await db.update(sourcesTable)
    .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
    .where(eq(sourcesTable.id, sourceId));

  return { sourceId, sourceName: source.name, total: items.length, added, skipped, errors };
}

// GET /automation/status
router.get("/automation/status", async (_req, res) => {
  const sources = await db.select().from(sourcesTable).where(eq(sourcesTable.active, true));
  const withFeeds = sources.filter((s) => !!s.feedUrl);
  res.json({
    aiAvailable: isAiAvailable(),
    activeSources: sources.length,
    sourcesWithFeed: withFeeds.length,
    sources: withFeeds.map((s) => ({
      id: s.id,
      name: s.name,
      feedUrl: s.feedUrl,
      lang: s.lang,
      lastFetchedAt: s.lastFetchedAt?.toISOString() ?? null,
    })),
  });
});

// POST /automation/fetch/:sourceId — fetch one source
router.post("/automation/fetch/:sourceId", async (req, res) => {
  const sourceId = parseInt(req.params.sourceId);
  if (isNaN(sourceId)) return res.status(400).json({ error: "Invalid source ID" });

  const useAi = req.body?.useAi !== false;
  try {
    const result = await fetchAndImportSource(sourceId, useAi);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /automation/fetch-all — fetch all active sources with feeds
router.post("/automation/fetch-all", async (req, res) => {
  const useAi = req.body?.useAi !== false;
  const sources = await db
    .select()
    .from(sourcesTable)
    .where(and(eq(sourcesTable.active, true)));

  const withFeeds = sources.filter((s) => !!s.feedUrl);
  if (!withFeeds.length) {
    return res.json({ message: "No active sources with feed URLs found", results: [] });
  }

  const results = [];
  for (const source of withFeeds) {
    try {
      const result = await fetchAndImportSource(source.id, useAi);
      results.push(result);
    } catch (err: any) {
      results.push({ sourceId: source.id, sourceName: source.name, error: err.message });
    }
  }

  const totalAdded = results.reduce((s: number, r: any) => s + (r.added || 0), 0);
  res.json({ totalAdded, results });
});

export default router;
