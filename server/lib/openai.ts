import OpenAI from "openai";
import { db } from "@db";
import { settings } from "@db/schema";
import { eq } from "drizzle-orm";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const getOpenAIClient = async () => {
  const settingsData = await db.query.settings.findFirst();
  if (!settingsData?.openaiApiKey) {
    throw new Error("OpenAI API key not configured");
  }
  
  return new OpenAI({ apiKey: settingsData.openaiApiKey });
};

export async function generateArticle(transcript: string) {
  const openai = await getOpenAIClient();
  const settingsData = await db.query.settings.findFirst();

  const prompt = `
Generate an SEO-optimized article based on this video transcript. 
${settingsData?.editorialGuidelines ? `Follow these editorial guidelines: ${settingsData.editorialGuidelines}` : ''}
${settingsData?.writingSamples?.length ? `Use these writing samples as reference for tone and style: ${settingsData.writingSamples.join('\n')}` : ''}

Respond with a JSON object containing:
{
  "article": "the full article content",
  "titles": ["5 SEO optimized titles"],
  "metaDescription": "155 character meta description",
  "tags": ["at least 5 tags including primary keyword"],
  "primaryKeyword": "the main keyword",
  "seoScore": number between 0-100
}

Transcript:
${transcript}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}
