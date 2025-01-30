import type { Express } from "express";
import { createServer } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { db } from "@db";
import { articles, settings } from "@db/schema";
import { getTranscript } from "./lib/youtube";
import { generateArticle } from "./services/openai";
import { humanizeContent } from "./lib/perplexity";
import { eq } from "drizzle-orm";

export function registerRoutes(app: Express) {
  const server = createServer(app);
  const wss = new WebSocketServer({ 
    server,
    verifyClient: ({ req, origin }, cb) => {
      // Allow Vite HMR websockets
      if (req.headers['sec-websocket-protocol'] === 'vite-hmr') {
        cb(false);
        return;
      }
      cb(true);
    }
  });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    ws.on('error', console.error);
    ws.on('close', () => console.log('Client disconnected'));
  });

  // Article generation
  app.post("/api/articles", async (req, res) => {
    try {
      console.log("Starting article generation process");
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "YouTube URL is required" });
      }

      const progressUpdate = (stage: string, percent: number) => {
        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
              type: 'progress',
              progress: { stage, percent }
            }));
          }
        });
      };

      // Step 1: Get transcript
      progressUpdate("extracting_transcript", 0);
      console.log("Fetching transcript for URL:", url);
      const transcript = await getTranscript(url).catch(error => {
        console.error("Failed to get transcript:", error);
        throw new Error("Could not fetch video transcript. Please check the URL and try again.");
      });
      progressUpdate("analyzing_transcript", 25);
      console.log("Successfully fetched transcript");

      // Step 2: Generate initial article
      progressUpdate("generating_draft", 50);
      console.log("Generating article from transcript");
      const openaiResult = await generateArticle(transcript).catch(error => {
        console.error("OpenAI API Error:", error);
        if (error.response?.data?.error?.message) {
          throw new Error(`AI Service Error: ${error.response.data.error.message}`);
        }
        throw new Error("Failed to generate article. Please try again later.");
      });
      progressUpdate("refining_content", 75);
      console.log("Successfully generated article");

      // Step 3: Humanize the content
      console.log("Humanizing content");
      const humanizedContent = await humanizeContent(openaiResult.article).catch(error => {
        console.error("Failed to humanize content:", error);
        throw new Error("Failed to refine article content. Please try again later.");
      });
      progressUpdate("finalizing", 90);
      console.log("Successfully humanized content");

      // Step 4: Save to database
      console.log("Saving article to database");
      const article = await db.insert(articles).values({
        youtubeUrl: url,
        title: openaiResult.titles[0],
        content: humanizedContent,
        metaDescription: openaiResult.metaDescription,
        seoTitles: openaiResult.titles,
        tags: openaiResult.tags,
        seoScore: openaiResult.seoScore,
      }).returning();
      progressUpdate("finalizing", 100);
      console.log("Successfully saved article to database");

      res.json(article[0]);
    } catch (error: any) {
      console.error("Article generation error:", error);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'error',
            message: error.message
          }));
        }
      });
      res.status(error.status || 500).json({ 
        message: error.message || "Failed to generate article",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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

  return server;
}