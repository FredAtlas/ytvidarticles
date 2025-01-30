import type { Express } from "express";
import { createServer } from "http";
import { db } from "@db";
import { articles, settings } from "@db/schema";
import { getTranscript } from "./lib/youtube";
import { generateArticle } from "./services/openai";
import { humanizeContent } from "./lib/perplexity";
import { eq } from "drizzle-orm";
import fs from "fs";
import path from "path";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);
  const TEMP_DIR = path.join(process.cwd(), 'temp');

  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
  }

  // Article generation
  app.post("/api/articles", async (req, res) => {
    try {
      console.log("Starting article generation process");
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ message: "YouTube URL is required" });
      }

      // Step 1: Get transcript
      console.log("Fetching transcript for URL:", url);
      const transcript = await getTranscript(url).catch(error => {
        console.error("Failed to get transcript:", error);
        throw new Error("Could not fetch video transcript. Please check the URL and try again.");
      });
      console.log("Successfully fetched transcript");

      // Save transcript to file for OpenAI processing
      const transcriptFile = path.join(TEMP_DIR, `transcript-${Date.now()}.txt`);
      fs.writeFileSync(transcriptFile, transcript);
      console.log("Saved transcript to file:", transcriptFile);

      // Step 2: Generate initial article and analyze topics
      console.log("Generating article from transcript file");
      const openaiResult = await generateArticle(transcriptFile).catch(error => {
        console.error("OpenAI API Error:", error);
        if (error.response?.data?.error?.message) {
          throw new Error(`AI Service Error: ${error.response.data.error.message}`);
        }
        throw new Error("Failed to generate article. Please try again later.");
      });
      console.log("Successfully generated article");

      // Clean up transcript file
      fs.unlinkSync(transcriptFile);

      // Step 3: Humanize the content
      console.log("Humanizing content");
      const humanizedContent = await humanizeContent(openaiResult.article).catch(error => {
        console.error("Failed to humanize content:", error);
        throw new Error("Failed to refine article content. Please try again later.");
      });
      console.log("Successfully humanized content");

      // Step 4: Save to database with transcript and topics
      console.log("Saving article to database");
      const article = await db.insert(articles).values({
        youtubeUrl: url,
        title: openaiResult.titles[0],
        content: humanizedContent,
        transcript: transcript,
        metaDescription: openaiResult.metaDescription,
        seoTitles: openaiResult.titles,
        tags: openaiResult.tags,
        seoScore: openaiResult.seoScore,
        keyTopics: openaiResult.keyTopics || [],
        missingTopics: openaiResult.missingTopics || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      console.log("Successfully saved article to database");

      res.status(200).json({
        status: "success",
        message: "Article generated successfully",
        data: article[0]
      });
    } catch (error: any) {
      console.error("Article generation error:", error);
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
      let settingsData = await db.query.settings.findFirst();

      // If no settings exist, create default settings
      if (!settingsData) {
        settingsData = await db.insert(settings)
          .values({
            editorialGuidelines: "",
            writingSamples: [],
          })
          .returning()
          .then(rows => rows[0]);
      }

      res.json(settingsData);
    } catch (error: any) {
      console.error("Failed to fetch settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  // Update settings
  app.put("/api/settings", async (req, res) => {
    try {
      let settingsData = await db.query.settings.findFirst();

      if (settingsData) {
        // Update existing settings
        settingsData = await db.update(settings)
          .set(req.body)
          .where(eq(settings.id, settingsData.id))
          .returning()
          .then(rows => rows[0]);
      } else {
        // Create new settings if they don't exist
        settingsData = await db.insert(settings)
          .values(req.body)
          .returning()
          .then(rows => rows[0]);
      }

      res.json(settingsData);
    } catch (error: any) {
      console.error("Failed to update settings:", error);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // Save edited article
  app.post("/api/articles/save", async (req, res) => {
    try {
      const { content, title, metaDescription, tags, transcript, keyTopics } = req.body;

      if (!content || !title || !metaDescription || !tags) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const article = await db.insert(articles).values({
        youtubeUrl: req.body.youtubeUrl || '',
        title,
        content,
        transcript: transcript || '',
        metaDescription,
        seoTitles: [title],
        tags,
        seoScore: req.body.seoScore || 0,
        keyTopics: keyTopics || [],
        missingTopics: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      res.status(200).json({
        status: "success",
        message: "Article saved successfully",
        data: article[0]
      });
    } catch (error: any) {
      console.error("Failed to save article:", error);
      res.status(500).json({ 
        message: "Failed to save article",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  return httpServer;
}