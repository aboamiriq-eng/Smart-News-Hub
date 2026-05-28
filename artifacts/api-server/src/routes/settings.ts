import { Router } from "express";
import { db } from "@workspace/db";
import { settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

const DEFAULTS = {
  siteNameAr: "منصة الأخبار",
  siteNameEn: "News Platform",
  defaultLang: "ar",
  logoUrl: null,
  faviconUrl: null,
  descriptionAr: "منصة إخبارية ذكية تدعم العربية والإنجليزية",
  descriptionEn: "Smart bilingual news platform",
  seoKeywordsAr: "أخبار, عربي, سياسة, اقتصاد",
  seoKeywordsEn: "news, arabic, english, world",
  googleAnalyticsId: null,
  twitterHandle: null,
  facebookUrl: null,
  articlesPerPage: 20,
  autoFetchEnabled: true,
  pruneAfterDays: 7,
};

async function getSettingsMap(): Promise<Record<string, string | null>> {
  const rows = await db.select().from(settingsTable);
  const map: Record<string, string | null> = {};
  for (const row of rows) {
    map[row.key] = row.value;
  }
  return map;
}

function buildSettings(map: Record<string, string | null>) {
  return {
    siteNameAr: map["siteNameAr"] ?? DEFAULTS.siteNameAr,
    siteNameEn: map["siteNameEn"] ?? DEFAULTS.siteNameEn,
    defaultLang: map["defaultLang"] ?? DEFAULTS.defaultLang,
    logoUrl: map["logoUrl"] ?? null,
    faviconUrl: map["faviconUrl"] ?? null,
    descriptionAr: map["descriptionAr"] ?? DEFAULTS.descriptionAr,
    descriptionEn: map["descriptionEn"] ?? DEFAULTS.descriptionEn,
    seoKeywordsAr: map["seoKeywordsAr"] ?? DEFAULTS.seoKeywordsAr,
    seoKeywordsEn: map["seoKeywordsEn"] ?? DEFAULTS.seoKeywordsEn,
    googleAnalyticsId: map["googleAnalyticsId"] ?? null,
    twitterHandle: map["twitterHandle"] ?? null,
    facebookUrl: map["facebookUrl"] ?? null,
    articlesPerPage: parseInt(map["articlesPerPage"] ?? "20") || 20,
    autoFetchEnabled: map["autoFetchEnabled"] !== "false",
    pruneAfterDays: parseInt(map["pruneAfterDays"] ?? "7") || 7,
  };
}

router.get("/settings", async (req, res) => {
  const map = await getSettingsMap();
  res.json(buildSettings(map));
});

router.patch("/settings", async (req, res) => {
  const updates = req.body as Record<string, unknown>;
  for (const [key, value] of Object.entries(updates)) {
    if (value === null || value === undefined) continue;
    const strValue = String(value);
    const existing = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
    if (existing.length > 0) {
      await db.update(settingsTable).set({ value: strValue, updatedAt: new Date() }).where(eq(settingsTable.key, key));
    } else {
      await db.insert(settingsTable).values({ key, value: strValue });
    }
  }
  const map = await getSettingsMap();
  res.json(buildSettings(map));
});

export default router;
