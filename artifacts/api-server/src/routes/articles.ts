import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable, categoriesTable, sourcesTable, pageViewsTable } from "@workspace/db";
import { eq, desc, ilike, and, sql, ne } from "drizzle-orm";
import { z } from "zod/v4";

const router = Router();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u0600-\u06FF\s]+/g, (match) => match.trim().replace(/\s+/g, "-"))
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 120);
}

function estimateReadTime(content: string | null): number {
  if (!content) return 1;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function enrichArticle(article: typeof articlesTable.$inferSelect) {
  const [category] = article.categoryId
    ? await db.select({ nameAr: categoriesTable.nameAr, nameEn: categoriesTable.nameEn })
        .from(categoriesTable)
        .where(eq(categoriesTable.id, article.categoryId))
        .limit(1)
    : [null];

  const [source] = article.sourceId
    ? await db.select({ name: sourcesTable.name })
        .from(sourcesTable)
        .where(eq(sourcesTable.id, article.sourceId))
        .limit(1)
    : [null];

  return {
    ...article,
    categoryName: category ? (article.lang === "ar" ? category.nameAr : category.nameEn) : null,
    sourceName: source?.name ?? null,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    scheduledAt: article.scheduledAt?.toISOString() ?? null,
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

router.get("/articles", async (req, res) => {
  const { lang, categoryId, status, featured, search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = parseInt(page) || 1;
  const limitNum = Math.min(parseInt(limit) || 20, 100);
  const offset = (pageNum - 1) * limitNum;

  const conditions = [];
  if (lang) conditions.push(eq(articlesTable.lang, lang));
  if (categoryId) conditions.push(eq(articlesTable.categoryId, parseInt(categoryId)));
  if (status) conditions.push(eq(articlesTable.status, status));
  if (featured !== undefined) conditions.push(eq(articlesTable.featured, featured === "true"));
  if (search) conditions.push(ilike(articlesTable.title, `%${search}%`));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [articles, countResult] = await Promise.all([
    db.select().from(articlesTable)
      .where(where)
      .orderBy(desc(articlesTable.createdAt))
      .limit(limitNum)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(articlesTable).where(where),
  ]);

  const total = Number(countResult[0]?.count ?? 0);
  const enriched = await Promise.all(articles.map(enrichArticle));

  res.json({
    articles: enriched,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  });
});

router.post("/articles", async (req, res) => {
  const body = req.body;
  const slug = body.slug || slugify(body.title) + "-" + Date.now();
  const readTime = estimateReadTime(body.content);

  const [article] = await db.insert(articlesTable).values({
    ...body,
    slug,
    readTime,
    tags: body.tags || [],
    keywords: body.keywords || [],
    publishedAt: body.publishedAt ? new Date(body.publishedAt) : (body.status === "published" ? new Date() : null),
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
  }).returning();

  const enriched = await enrichArticle(article);
  res.status(201).json(enriched);
});

router.get("/articles/trending", async (req, res) => {
  const { lang, limit = "10" } = req.query as Record<string, string>;
  const limitNum = parseInt(limit) || 10;

  const conditions = [eq(articlesTable.status, "published")];
  if (lang) conditions.push(eq(articlesTable.lang, lang));

  const articles = await db.select().from(articlesTable)
    .where(and(...conditions))
    .orderBy(desc(articlesTable.viewCount))
    .limit(limitNum);

  const enriched = await Promise.all(articles.map(enrichArticle));
  res.json(enriched);
});

router.get("/articles/featured", async (req, res) => {
  const { lang } = req.query as Record<string, string>;

  const conditions = [eq(articlesTable.status, "published"), eq(articlesTable.featured, true)];
  if (lang) conditions.push(eq(articlesTable.lang, lang));

  const articles = await db.select().from(articlesTable)
    .where(and(...conditions))
    .orderBy(desc(articlesTable.publishedAt))
    .limit(10);

  const enriched = await Promise.all(articles.map(enrichArticle));
  res.json(enriched);
});

router.get("/articles/sitemap", async (req, res) => {
  const articles = await db.select({
    slug: articlesTable.slug,
    title: articlesTable.title,
    updatedAt: articlesTable.updatedAt,
    lang: articlesTable.lang,
    imageUrl: articlesTable.imageUrl,
  }).from(articlesTable)
    .where(eq(articlesTable.status, "published"))
    .orderBy(desc(articlesTable.updatedAt))
    .limit(5000);

  res.json(articles.map(a => ({
    ...a,
    updatedAt: a.updatedAt.toISOString(),
  })));
});

router.get("/articles/slug/:slug", async (req, res) => {
  const [article] = await db.select().from(articlesTable)
    .where(eq(articlesTable.slug, req.params.slug))
    .limit(1);

  if (!article) return res.status(404).json({ error: "Not found" });
  res.json(await enrichArticle(article));
});

router.get("/articles/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const [article] = await db.select().from(articlesTable)
    .where(eq(articlesTable.id, id))
    .limit(1);

  if (!article) return res.status(404).json({ error: "Not found" });
  res.json(await enrichArticle(article));
});

router.patch("/articles/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const body = { ...req.body };
  if (body.publishedAt) body.publishedAt = new Date(body.publishedAt);
  if (body.scheduledAt) body.scheduledAt = new Date(body.scheduledAt);
  if (body.content) body.readTime = estimateReadTime(body.content);
  body.updatedAt = new Date();

  const [article] = await db.update(articlesTable)
    .set(body)
    .where(eq(articlesTable.id, id))
    .returning();

  if (!article) return res.status(404).json({ error: "Not found" });
  res.json(await enrichArticle(article));
});

router.delete("/articles/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  await db.delete(articlesTable).where(eq(articlesTable.id, id));
  res.status(204).send();
});

router.post("/articles/:id/view", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const [article] = await db.update(articlesTable)
    .set({ viewCount: sql`${articlesTable.viewCount} + 1` })
    .where(eq(articlesTable.id, id))
    .returning({ viewCount: articlesTable.viewCount, lang: articlesTable.lang });

  if (!article) return res.status(404).json({ error: "Not found" });

  await db.insert(pageViewsTable).values({
    articleId: id,
    lang: article.lang,
    ip: req.ip ?? null,
    userAgent: req.headers["user-agent"] ?? null,
  });

  res.json({ viewCount: article.viewCount });
});

router.get("/articles/:id/related", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const [current] = await db.select().from(articlesTable)
    .where(eq(articlesTable.id, id))
    .limit(1);

  if (!current) return res.status(404).json({ error: "Not found" });

  const related = await db.select().from(articlesTable)
    .where(
      and(
        eq(articlesTable.lang, current.lang),
        eq(articlesTable.status, "published"),
        ne(articlesTable.id, id),
        current.categoryId ? eq(articlesTable.categoryId, current.categoryId) : sql`1=1`,
      )
    )
    .orderBy(desc(articlesTable.publishedAt))
    .limit(6);

  const enriched = await Promise.all(related.map(enrichArticle));
  res.json(enriched);
});

export default router;
