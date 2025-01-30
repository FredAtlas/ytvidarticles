import OpenAI from "openai";
import { db } from "@db";
import { settings } from "@db/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured in environment variables");
  }

  return new OpenAI({ apiKey });
};

export async function generateArticle(transcript: string) {
  const openai = getOpenAIClient();
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
    model: "gpt-4-1106-preview",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content);
}