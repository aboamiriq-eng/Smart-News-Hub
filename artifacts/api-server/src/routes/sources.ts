import { Router } from "express";
import { db } from "@workspace/db";
import { sourcesTable, articlesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/sources", async (req, res) => {
  const sources = await db.select().from(sourcesTable).orderBy(sourcesTable.name);

  const enriched = await Promise.all(
    sources.map(async (src) => {
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(articlesTable)
        .where(eq(articlesTable.sourceId, src.id));
      return {
        ...src,
        articleCount: Number(count),
        lastFetchedAt: src.lastFetchedAt?.toISOString() ?? null,
      };
    })
  );

  res.json(enriched);
});

router.post("/sources", async (req, res) => {
  const [source] = await db.insert(sourcesTable).values(req.body).returning();
  res.status(201).json({ ...source, articleCount: 0, lastFetchedAt: null });
});

router.patch("/sources/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const [source] = await db.update(sourcesTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(sourcesTable.id, id))
    .returning();

  if (!source) return res.status(404).json({ error: "Not found" });

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(articlesTable)
    .where(eq(articlesTable.sourceId, id));

  res.json({ ...source, articleCount: Number(count), lastFetchedAt: source.lastFetchedAt?.toISOString() ?? null });
});

router.delete("/sources/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  await db.delete(sourcesTable).where(eq(sourcesTable.id, id));
  res.status(204).send();
});

router.post("/sources/:id/fetch", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const [source] = await db.select().from(sourcesTable).where(eq(sourcesTable.id, id)).limit(1);
  if (!source) return res.status(404).json({ error: "Not found" });

  await db.update(sourcesTable)
    .set({ lastFetchedAt: new Date(), updatedAt: new Date() })
    .where(eq(sourcesTable.id, id));

  res.json({ success: true, articlesAdded: 0, message: "Fetch triggered — auto-fetching requires external cron setup" });
});

export default router;
