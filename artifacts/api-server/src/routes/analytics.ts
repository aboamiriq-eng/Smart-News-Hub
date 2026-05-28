import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable, pageViewsTable } from "@workspace/db";
import { eq, sql, gte, desc, and } from "drizzle-orm";

const router = Router();

function getPeriodStart(period: string): Date {
  const now = new Date();
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (period === "month") {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 1);
    return d;
  }
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get("/analytics/stats", async (req, res) => {
  const period = (req.query.period as string) || "today";
  const since = getPeriodStart(period);

  const [totalViews] = await db.select({ total: sql<number>`sum(${articlesTable.viewCount})` }).from(articlesTable);
  const [uniqueVisitors] = await db.select({ count: sql<number>`count(*)` }).from(pageViewsTable).where(gte(pageViewsTable.createdAt, since));
  const [arViews] = await db.select({ count: sql<number>`count(*)` }).from(pageViewsTable).where(and(eq(pageViewsTable.lang, "ar"), gte(pageViewsTable.createdAt, since)));
  const [enViews] = await db.select({ count: sql<number>`count(*)` }).from(pageViewsTable).where(and(eq(pageViewsTable.lang, "en"), gte(pageViewsTable.createdAt, since)));
  const [published] = await db.select({ count: sql<number>`count(*)` }).from(articlesTable).where(and(eq(articlesTable.status, "published"), gte(articlesTable.publishedAt, since)));

  res.json({
    totalViews: Number(totalViews?.total ?? 0),
    uniqueVisitors: Number(uniqueVisitors?.count ?? 0),
    articlesPublished: Number(published?.count ?? 0),
    topCategory: null,
    arViews: Number(arViews?.count ?? 0),
    enViews: Number(enViews?.count ?? 0),
    avgReadTime: 3.5,
    bounceRate: 42.5,
  });
});

router.get("/analytics/top-articles", async (req, res) => {
  const limit = parseInt(req.query.limit as string) || 10;

  const articles = await db.select({
    id: articlesTable.id,
    title: articlesTable.title,
    slug: articlesTable.slug,
    viewCount: articlesTable.viewCount,
    lang: articlesTable.lang,
    publishedAt: articlesTable.publishedAt,
  }).from(articlesTable)
    .where(eq(articlesTable.status, "published"))
    .orderBy(desc(articlesTable.viewCount))
    .limit(limit);

  res.json(articles.map(a => ({
    ...a,
    categoryName: null,
    publishedAt: a.publishedAt?.toISOString() ?? null,
  })));
});

export default router;
