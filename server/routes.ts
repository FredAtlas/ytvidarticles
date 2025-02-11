import type { Express } from "express";
import { createServer } from "http";
import { db } from "@db";
import { articles, settings } from "@db/schema";
import { getTranscript } from "./lib/youtube";
import { generateArticle } from "./services/openai"; // Updated import path
import { humanizeContent } from "./lib/perplexity";
import { eq, inArray } from "drizzle-orm";
import fs from "fs";
import path from "path";

export function registerRoutes(app: Express) {
  const httpServer = createServer(app);
  const TEMP_DIR = path.join(process.cwd(), 'temp');

  // Ensure temp directory exists
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR);
  }

  app.post("/api/articles", async (req, res) => {
    try {
      console.log("Starting article generation process");
      const { url } = req.body;

      if (!url) {
        return res.status(400).json({ 
          status: "error",
          message: "YouTube URL is required" 
        });
      }

      // Step 1: Get transcript
      console.log("Fetching transcript for URL:", url);
      const transcript = await getTranscript(url);
      console.log("Successfully fetched transcript");

      // Save transcript to file for OpenAI processing
      const transcriptFile = path.join(TEMP_DIR, `transcript-${Date.now()}.txt`);
      fs.writeFileSync(transcriptFile, transcript);
      console.log("Saved transcript to file:", transcriptFile);

      // Step 2: Generate initial article
      console.log("Generating article from transcript file");
      const openaiResult = await generateArticle(transcriptFile);
      console.log("Successfully generated article");

      // Clean up transcript file
      fs.unlinkSync(transcriptFile);

      // Step 3: Humanize the content
      console.log("Humanizing content");
      const humanizedContent = await humanizeContent(openaiResult.article);
      console.log("Successfully humanized content");

      // Step 4: Save to database
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
        generationChunks: openaiResult.generationChunks || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      res.status(200).json({
        status: "success",
        message: "Article generated successfully",
        data: article[0]
      });
    } catch (error: any) {
      console.error("Article generation error:", error);
      res.status(400).json({ 
        status: "error",
        message: error.message || "Failed to generate article"
      });
    }
  });

  // Get single article by ID
  app.get("/api/articles/:id", async (req, res) => {
    try {
      const article = await db.query.articles.findFirst({
        where: eq(articles.id, parseInt(req.params.id)),
      });

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json(article);
    } catch (error: any) {
      console.error("Failed to fetch article:", error);
      res.status(500).json({ message: "Failed to fetch article" });
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

  // Generate social media content for an article
  app.post("/api/articles/:id/improve", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }
    
    const settingsData = await db.query.settings.findFirst();
    const improvedContent = await refineContent(
      content,
      settingsData?.writingSamples || []
    );

    await db.update(articles)
      .set({ content: improvedContent, updatedAt: new Date() })
      .where(eq(articles.id, id));

    res.json({ content: improvedContent });
  } catch (error: any) {
    console.error("Content improvement error:", error);
    res.status(500).json({ 
      error: "Failed to improve content",
      details: error.message 
    });
  }
  });

  app.post("/api/articles/:id/social-media", async (req, res) => {
    try {
      const article = await db.query.articles.findFirst({
        where: eq(articles.id, parseInt(req.params.id)),
      });

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const socialContent = await generateSocialMediaContent(article.content);

      res.json({
        status: "success",
        data: socialContent
      });
    } catch (error: any) {
      console.error("Failed to generate social media content:", error);
      res.status(500).json({ 
        message: "Failed to generate social media content",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
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

  // Delete multiple articles
  app.delete("/api/articles", async (req, res) => {
    try {
      const { ids } = req.body;
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Invalid article IDs" });
      }

      // Ensure all IDs are numbers
      const numericIds = ids.map(id => Number(id)).filter(id => !isNaN(id));
      if (numericIds.length === 0) {
        return res.status(400).json({ message: "No valid article IDs provided" });
      }

      await db.delete(articles).where(inArray(articles.id, numericIds));
      
      res.status(200).json({
        status: "success",
        message: "Articles deleted successfully"
      });
    } catch (error: any) {
      console.error("Failed to delete articles:", error);
      res.status(500).json({ 
        message: "Failed to delete articles",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Save edited article
  app.post("/api/articles/save", async (req, res) => {
    try {
      const { id, content, title, metaDescription, tags, transcript, keyTopics } = req.body;

      if (!content || !title || !metaDescription || !tags) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      let article;

      if (id) {
        // Update existing article
        article = await db.update(articles)
          .set({
            title,
            content,
            transcript: transcript || '',
            metaDescription,
            seoTitles: [title],
            tags,
            seoScore: req.body.seoScore || 0,
            keyTopics: keyTopics || [],
            missingTopics: [],
            updatedAt: new Date(),
          })
          .where(eq(articles.id, id))
          .returning();
      } else {
        // Create new article
        article = await db.insert(articles).values({
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
      }

      res.status(200).json({
        status: "success",
        message: id ? "Article updated successfully" : "Article saved successfully",
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

    // Enhanced content integration endpoint
    app.post("/api/articles/integrate", async (req, res) => {
      try {
        const { existingContent, newSection } = req.body;
        if (!existingContent || !newSection) {
          return res.status(400).json({ message: "Missing required content" });
        }
        const settingsData = await db.query.settings.findFirst();
        const integratedContent = await integrateContent(
          existingContent, 
          newSection,
          settingsData?.editorialGuidelines
        );
        res.status(200).json({
          status: "success",
          integratedContent
        });
      } catch (error: any) {
        console.error("Content integration error:", error);
        res.status(500).json({ 
          message: "Failed to integrate content",
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
      }
    });
    
  // Export article to WordPress
  app.post("/api/articles/:id/wordpress-export", async (req, res) => {
    try {
      const article = await db.query.articles.findFirst({
        where: eq(articles.id, parseInt(req.params.id)),
      });

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const result = await createWordPressDraft(
        article.title,
        article.content,
        article.metaDescription,
        article.tags
      );

      res.json({
        status: "success",
        message: "Article exported to WordPress successfully",
        data: result
      });
    } catch (error: any) {
      console.error("Failed to export to WordPress:", error);
      res.status(500).json({ 
        message: error.message || "Failed to export to WordPress",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  
  // Update article publication status
  app.post("/api/articles/:id/publish", async (req, res) => {
    try {
      const { publishedAt } = req.body;
      const id = parseInt(req.params.id);

      const article = await db.update(articles)
        .set({
          isPublished: true,
          publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
          updatedAt: new Date(),
        })
        .where(eq(articles.id, id))
        .returning();

      if (!article.length) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json({
        status: "success",
        message: "Article marked as published",
        data: article[0]
      });
    } catch (error: any) {
      console.error("Failed to update publication status:", error);
      res.status(500).json({ 
        message: "Failed to update publication status",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });

  // Unpublish article
  app.post("/api/articles/:id/unpublish", async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const article = await db.update(articles)
        .set({
          isPublished: false,
          publishedAt: null,
          updatedAt: new Date(),
        })
        .where(eq(articles.id, id))
        .returning();

      if (!article.length) {
        return res.status(404).json({ message: "Article not found" });
      }

      res.json({
        status: "success",
        message: "Article unpublished",
        data: article[0]
      });
    } catch (error: any) {
      console.error("Failed to unpublish article:", error);
      res.status(500).json({ 
        message: "Failed to unpublish article",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  });
  // Convert article to RTF
  app.post("/api/articles/:id/html", async (req, res) => {
    try {
      const article = await db.query.articles.findFirst({
        where: eq(articles.id, parseInt(req.params.id)),
      });

      if (!article) {
        return res.status(404).json({ message: "Article not found" });
      }

      const htmlContent = convertToHtml(article.content);
      
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', `attachment; filename="article-${article.id}.html"`);
      res.send(htmlContent);
    } catch (error: any) {
      console.error("Failed to convert to RTF:", error);
      res.status(500).json({ message: "Failed to convert article to RTF" });
    }
  });

  return httpServer;
}