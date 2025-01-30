import OpenAI from "openai";
import { db } from "@db";
import { settings } from "@db/schema";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured in environment variables");
  }
  return new OpenAI({ apiKey });
};

async function retryWithDelay<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error?.status === 429 || error?.status === 503)) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryWithDelay(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

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

  const response = await retryWithDelay(() => 
    openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    })
  );

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("Failed to generate article: No content received from OpenAI");
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to parse OpenAI response:", error);
    throw new Error("Failed to generate article: Invalid response format");
  }
}

export async function generateTitles(content: string) {
  const openai = getOpenAIClient();

  const response = await retryWithDelay(() =>
    openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Generate 5 SEO-optimized titles for the article. Output as JSON array.",
        },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
    })
  );

  const responseContent = response.choices[0].message.content;
  if (!responseContent) {
    throw new Error("Failed to generate titles: No content received from OpenAI");
  }

  try {
    return JSON.parse(responseContent).titles;
  } catch (error) {
    console.error("Failed to parse OpenAI response for titles:", error);
    throw new Error("Failed to generate titles: Invalid response format");
  }
}

export async function generateMetaDescription(content: string) {
  const openai = getOpenAIClient();

  const response = await retryWithDelay(() =>
    openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Generate a compelling 155-character meta description. Output as JSON with field: metaDescription",
        },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
    })
  );

  const responseContent = response.choices[0].message.content;
  if (!responseContent) {
    throw new Error("Failed to generate meta description: No content received from OpenAI");
  }

  try {
    return JSON.parse(responseContent).metaDescription;
  } catch (error) {
    console.error("Failed to parse OpenAI response for meta description:", error);
    throw new Error("Failed to generate meta description: Invalid response format");
  }
}