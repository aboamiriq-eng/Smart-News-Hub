import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const articlesTable = pgTable("articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary"),
  content: text("content"),
  imageUrl: text("image_url"),
  imageAlt: text("image_alt"),
  lang: text("lang").notNull().default("ar"),
  status: text("status").notNull().default("draft"),
  featured: boolean("featured").notNull().default(false),
  breaking: boolean("breaking").notNull().default(false),
  categoryId: integer("category_id"),
  sourceId: integer("source_id"),
  tags: text("tags").array().notNull().default([]),
  metaTitle: text("meta_title"),
  metaDescription: text("meta_description"),
  keywords: text("keywords").array().notNull().default([]),
  viewCount: integer("view_count").notNull().default(0),
  readTime: integer("read_time"),
  publishedAt: timestamp("published_at"),
  scheduledAt: timestamp("scheduled_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertArticleSchema = createInsertSchema(articlesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertArticle = z.infer<typeof insertArticleSchema>;
export type Article = typeof articlesTable.$inferSelect;
