import OpenAI from "openai";
import { z } from "zod";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface ArticleGeneration {
  content: string;
  titles: string[];
  metaDescription: string;
  tags: string[];
  seoScore: number;
}

const articleResponseSchema = z.object({
  content: z.string(),
  titles: z.array(z.string()),
  metaDescription: z.string().max(155),
  tags: z.array(z.string()),
  seoScore: z.number().min(0).max(100)
});

export async function generateArticle(transcript: string): Promise<ArticleGeneration> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert SEO content writer. Generate an article based on the provided transcript along with SEO metadata."
        },
        {
          role: "user",
          content: `Generate an SEO-optimized article based on this transcript along with 5 title variations, a 155-character meta description, and 5+ relevant tags. Format the response as JSON with these fields: content, titles (array), metaDescription (max 155 chars), tags (array), and seoScore (0-100).\n\nTranscript:\n${transcript}`
        }
      ],
      response_format: { type: "json_object" }
    });

    const result = articleResponseSchema.parse(
      JSON.parse(response.choices[0].message.content)
    );
    
    return result;
  } catch (error) {
    throw new Error(`Failed to generate article: ${error.message}`);
  }
}
