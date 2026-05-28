import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, articlesTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/categories", async (req, res) => {
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.sortOrder);

  const enriched = await Promise.all(
    categories.map(async (cat) => {
      const [{ count }] = await db.select({ count: sql<number>`count(*)` })
        .from(articlesTable)
        .where(eq(articlesTable.categoryId, cat.id));
      return {
        ...cat,
        articleCount: Number(count),
      };
    })
  );

  res.json(enriched);
});

router.post("/categories", async (req, res) => {
  const [category] = await db.insert(categoriesTable).values(req.body).returning();

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(articlesTable)
    .where(eq(articlesTable.categoryId, category.id));

  res.status(201).json({ ...category, articleCount: Number(count) });
});

router.patch("/categories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const [category] = await db.update(categoriesTable)
    .set({ ...req.body, updatedAt: new Date() })
    .where(eq(categoriesTable.id, id))
    .returning();

  if (!category) return res.status(404).json({ error: "Not found" });

  const [{ count }] = await db.select({ count: sql<number>`count(*)` })
    .from(articlesTable)
    .where(eq(articlesTable.categoryId, id));

  res.json({ ...category, articleCount: Number(count) });
});

router.delete("/categories/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.status(204).send();
});

export default router;
