import { Router } from "express";
import { db } from "@workspace/db";
import { advertisementsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router = Router();

router.get("/advertisements", async (req, res) => {
  const { position, active } = req.query as Record<string, string>;

  const conditions = [];
  if (position) conditions.push(eq(advertisementsTable.position, position));
  if (active !== undefined) conditions.push(eq(advertisementsTable.active, active === "true"));

  const ads = await db.select().from(advertisementsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(advertisementsTable.createdAt);

  res.json(ads.map(ad => ({
    ...ad,
    startDate: ad.startDate?.toISOString() ?? null,
    endDate: ad.endDate?.toISOString() ?? null,
  })));
});

router.post("/advertisements", async (req, res) => {
  const body = { ...req.body };
  if (body.startDate) body.startDate = new Date(body.startDate);
  if (body.endDate) body.endDate = new Date(body.endDate);

  const [ad] = await db.insert(advertisementsTable).values(body).returning();
  res.status(201).json({
    ...ad,
    startDate: ad.startDate?.toISOString() ?? null,
    endDate: ad.endDate?.toISOString() ?? null,
  });
});

router.patch("/advertisements/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  const body = { ...req.body, updatedAt: new Date() };
  if (body.startDate) body.startDate = new Date(body.startDate);
  if (body.endDate) body.endDate = new Date(body.endDate);

  const [ad] = await db.update(advertisementsTable)
    .set(body)
    .where(eq(advertisementsTable.id, id))
    .returning();

  if (!ad) return res.status(404).json({ error: "Not found" });
  res.json({
    ...ad,
    startDate: ad.startDate?.toISOString() ?? null,
    endDate: ad.endDate?.toISOString() ?? null,
  });
});

router.delete("/advertisements/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });

  await db.delete(advertisementsTable).where(eq(advertisementsTable.id, id));
  res.status(204).send();
});

export default router;
