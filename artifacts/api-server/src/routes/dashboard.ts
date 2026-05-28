import { Router } from "express";
import { db } from "@workspace/db";
import { articlesTable, categoriesTable, sourcesTable, pageViewsTable } from "@workspace/db";
import { eq, sql, and, gte, desc } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [total] = await db.select({ count: sql<number>`count(*)` }).from(articlesTable);
  const [totalViews] = await db.select({ sum: sql<number>`sum(${articlesTable.viewCount})` }).from(articlesTable);
  const [publishedToday] = await db.select({ count: sql<number>`count(*)` }).from(articlesTable).where(and(eq(articlesTable.status, "published"), gte(articlesTable.publishedAt, today)));
  const [arCount] = await db.select({ count: sql<number>`count(*)` }).from(articlesTable).where(eq(articlesTable.lang, "ar"));
  const [enCount] = await db.select({ count: sql<number>`count(*)` }).from(articlesTable).where(eq(articlesTable.lang, "en"));
  const [activeCategories] = await db.select({ count: sql<number>`count(*)` }).from(categoriesTable).where(eq(categoriesTable.active, true));
  const [activeSources] = await db.select({ count: sql<number>`count(*)` }).from(sourcesTable).where(eq(sourcesTable.active, true));
  const [scheduled] = await db.select({ count: sql<number>`count(*)` }).from(articlesTable).where(eq(articlesTable.status, "scheduled"));

  const recentArticles = await db.select().from(articlesTable)
    .where(eq(articlesTable.status, "published"))
    .orderBy(desc(articlesTable.publishedAt))
    .limit(5);

  res.json({
    totalArticles: Number(total?.count ?? 0),
    publishedToday: Number(publishedToday?.count ?? 0),
    totalViews: Number(totalViews?.sum ?? 0),
    activeCategories: Number(activeCategories?.count ?? 0),
    activeSources: Number(activeSources?.count ?? 0),
    arArticles: Number(arCount?.count ?? 0),
    enArticles: Number(enCount?.count ?? 0),
    pendingScheduled: Number(scheduled?.count ?? 0),
    recentArticles: recentArticles.map(a => ({
      ...a,
      categoryName: null,
      sourceName: null,
      publishedAt: a.publishedAt?.toISOString() ?? null,
      scheduledAt: a.scheduledAt?.toISOString() ?? null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    })),
  });
});

router.get("/dashboard/live-visitors", async (req, res) => {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const [total] = await db.select({ count: sql<number>`count(*)` }).from(pageViewsTable).where(gte(pageViewsTable.createdAt, fiveMinutesAgo));
  const [ar] = await db.select({ count: sql<number>`count(*)` }).from(pageViewsTable).where(and(eq(pageViewsTable.lang, "ar"), gte(pageViewsTable.createdAt, fiveMinutesAgo)));
  const [en] = await db.select({ count: sql<number>`count(*)` }).from(pageViewsTable).where(and(eq(pageViewsTable.lang, "en"), gte(pageViewsTable.createdAt, fiveMinutesAgo)));

  res.json({
    count: Number(total?.count ?? 0),
    arCount: Number(ar?.count ?? 0),
    enCount: Number(en?.count ?? 0),
  });
});

export default router;
