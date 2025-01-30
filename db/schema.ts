import { pgTable, text, serial, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const articles = pgTable("articles", {
  id: serial("id").primaryKey(),
  youtubeUrl: text("youtube_url").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  transcript: text("transcript").notNull().default(''),
  metaDescription: text("meta_description").notNull(),
  seoTitles: jsonb("seo_titles").notNull().$type<string[]>(),
  tags: jsonb("tags").notNull().$type<string[]>(),
  seoScore: integer("seo_score").notNull(),
  keyTopics: jsonb("key_topics").notNull().default(['']).$type<string[]>(),
  missingTopics: jsonb("missing_topics").default(['']).$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  editorialGuidelines: text("editorial_guidelines"),
  writingSamples: jsonb("writing_samples").$type<string[]>(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertArticleSchema = createInsertSchema(articles);
export const selectArticleSchema = createSelectSchema(articles);
export const insertSettingsSchema = createInsertSchema(settings);
export const selectSettingsSchema = createSelectSchema(settings);

export type Article = typeof articles.$inferSelect;
export type Settings = typeof settings.$inferSelect;