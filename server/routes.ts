import type { Express } from "express";
import { createServer } from "http";
import { db } from "@db";
import { articles, settings } from "@db/schema";
import { getTranscript } from "./lib/youtube";
import { generateArticle } from "./services/openai";
import { humanizeContent } from "./lib/perplexity";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);

  // Article generation
  app.post("/api/articles", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "YouTube URL is required" });
      }

      const steps = [
        { step: "Fetching transcript", status: "processing" },
        { step: "Generating article", status: "waiting" },
        { step: "Refining content", status: "waiting" },
        { step: "Saving article", status: "waiting" }
      ];

      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      });

      const sendProgress = () => {
        res.write(`data: ${JSON.stringify({ steps })}\n\n`);
      };

      // Initial progress
      sendProgress();

      console.log("Step 1: Fetching transcript");
      const transcript = await getTranscript(url).catch(error => {
        console.error("Transcript error:", error);
        steps[0].status = "error";
        sendProgress();
        throw new Error("Could not fetch video transcript. Please check the URL and try again.");
      });

      steps[0].status = "completed";
      steps[1].status = "processing";
      sendProgress();

      console.log("Step 2: Generating article");
      const openaiResult = await generateArticle(transcript).catch(error => {
        console.error("OpenAI error:", error);
        steps[1].status = "error";
        sendProgress();
        throw new Error(error.message || "Failed to generate article. Please try again later.");
      });

      steps[1].status = "completed";
      steps[2].status = "processing";
      sendProgress();

      console.log("Step 3: Refining content");
      const humanizedContent = await humanizeContent(openaiResult.article).catch(error => {
        console.error("Content refinement error:", error);
        steps[2].status = "error";
        sendProgress();
        throw new Error("Failed to refine article content. Please try again later.");
      });

      steps[2].status = "completed";
      steps[3].status = "processing";
      sendProgress();

      console.log("Step 4: Saving to database");
      const article = await db.insert(articles).values({
        youtubeUrl: url,
        title: openaiResult.titles[0],
        content: humanizedContent,
        metaDescription: openaiResult.metaDescription,
        seoTitles: openaiResult.titles,
        tags: openaiResult.tags,
        seoScore: openaiResult.seoScore,
      }).returning();

      steps[3].status = "completed";
      sendProgress();

      // Send the final article data
      res.write(`data: ${JSON.stringify({ article: article[0] })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("Article generation error:", error);
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });

  // Get all articles
  app.get("/api/articles", async (req, res) => {
    try {
      const allArticles = await db.query.articles.findMany({
        orderBy: (articles, { desc }) => [desc(articles.createdAt)]
      });
      res.json(allArticles);
    } catch (error: any) {
      console.error("Failed to fetch articles:", error);
      res.status(500).json({ message: "Failed to fetch articles" });
    }
  });

  // Get settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settingsData = await db.query.settings.findFirst();
      res.json(settingsData || {});
    } catch (error: any) {
      console.error("Failed to fetch settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
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
    } catch (error: any) {
      console.error("Failed to update settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  return httpServer;
}