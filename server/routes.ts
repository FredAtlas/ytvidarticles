import type { Express } from "express";
import { createServer } from "http";
import { db } from "@db";
import { articles, settings } from "@db/schema";
import { getTranscript } from "./lib/youtube";
import { generateArticle } from "./lib/openai";
import { humanizeContent } from "./lib/perplexity";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Article generation
  app.post("/api/articles", async (req, res) => {
    try {
      const { url } = req.body;
      const transcript = await getTranscript(url);
      const openaiResult = await generateArticle(transcript);
      const humanizedContent = await humanizeContent(openaiResult.article);

      const article = await db.insert(articles).values({
        youtubeUrl: url,
        title: openaiResult.titles[0],
        content: humanizedContent,
        metaDescription: openaiResult.metaDescription,
        seoTitles: openaiResult.titles,
        tags: openaiResult.tags,
        seoScore: openaiResult.seoScore,
      }).returning();

      res.json(article[0]);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get all articles
  app.get("/api/articles", async (req, res) => {
    try {
      const allArticles = await db.query.articles.findMany({
        orderBy: (articles, { desc }) => [desc(articles.createdAt)]
      });
      res.json(allArticles);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settingsData = await db.query.settings.findFirst();
      res.json(settingsData || {});
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update settings
  app.put("/api/settings", async (req, res) => {
    try {
      const settingsData = await db.query.settings.findFirst();
      if (settingsData) {
        const updated = await db.update(settings)
          .set(req.body)
          .where(eq(settings.id, settingsData.id))
          .returning();
        res.json(updated[0]);
      } else {
        const created = await db.insert(settings)
          .values(req.body)
          .returning();
        res.json(created[0]);
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  return httpServer;
}
