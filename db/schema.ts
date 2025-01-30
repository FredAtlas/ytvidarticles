import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  youtubeUrl: text("youtube_url").notNull(),
  transcript: text("transcript").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metaDescription: text("meta_description").notNull(),
  seoScore: integer("seo_score").notNull(),
  titleVariations: jsonb("title_variations").notNull().$type<string[]>(),
  tags: jsonb("tags").notNull().$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  apiKeys: jsonb("api_keys").notNull().$type<{
    openai?: string;
    perplexity?: string;
  }>(),
  editorialGuidelines: text("editorial_guidelines"),
  writingSamples: jsonb("writing_samples").notNull().$type<string[]>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertArticleSchema = createInsertSchema(articles);
export const selectArticleSchema = createSelectSchema(articles);
export const insertSettingsSchema = createInsertSchema(settings);
export const selectSettingsSchema = createSelectSchema(settings);

export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
