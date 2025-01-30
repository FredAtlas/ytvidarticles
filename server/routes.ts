import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { articles, settings } from "@db/schema";
import { getTranscript } from "./lib/youtube";
import { generateArticle } from "./lib/openai";
import { humanizeContent } from "./lib/perplexity";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Get article history
  app.get("/api/articles", async (req, res) => {
    try {
      const allArticles = await db.query.articles.findMany({
        orderBy: (articles, { desc }) => [desc(articles.createdAt)]
      });
      res.json(allArticles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Generate article from YouTube URL
  app.post("/api/articles", async (req, res) => {
    try {
      const { url } = req.body;
      
      // Get transcript
      const transcript = await getTranscript(url);
      
      // Generate initial content with OpenAI
      const generated = await generateArticle(transcript);
      
      // Humanize with Perplexity
      const humanizedContent = await humanizeContent(generated.content);
      
      // Save to database
      const [article] = await db.insert(articles).values({
        youtubeUrl: url,
        transcript,
        content: humanizedContent,
        title: generated.titles[0],
        titleVariations: generated.titles,
        metaDescription: generated.metaDescription,
        tags: generated.tags,
        seoScore: generated.seoScore
      }).returning();
      
      res.json(article);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const [userSettings] = await db.query.settings.findMany();
      res.json(userSettings || {
        apiKeys: {},
        editorialGuidelines: "",
        writingSamples: []
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update settings
  app.put("/api/settings", async (req, res) => {
    try {
      const { apiKeys, editorialGuidelines, writingSamples } = req.body;
      
      const [existingSettings] = await db.query.settings.findMany();
      
      if (existingSettings) {
        const [updated] = await db
          .update(settings)
          .set({
            apiKeys,
            editorialGuidelines,
            writingSamples,
            updatedAt: new Date()
          })
          .where(eq(settings.id, existingSettings.id))
          .returning();
        res.json(updated);
      } else {
        const [created] = await db
          .insert(settings)
          .values({
            apiKeys,
            editorialGuidelines,
            writingSamples
          })
          .returning();
        res.json(created);
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
