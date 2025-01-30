import OpenAI from "openai";
import { db } from "@db";
import { settings } from "@db/schema";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MAX_CHUNK_LENGTH = 6000; // Safe limit for GPT-4 considering system message and response

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
    console.error('OpenAI API Error:', error);
    throw error;
  }
}

function splitTranscriptIntoChunks(transcript: string): string[] {
  const words = transcript.split(' ');
  const chunks: string[] = [];
  let currentChunk: string[] = [];
  let currentLength = 0;

  for (const word of words) {
    if (currentLength + word.length > MAX_CHUNK_LENGTH) {
      chunks.push(currentChunk.join(' '));
      currentChunk = [word];
      currentLength = word.length;
    } else {
      currentChunk.push(word);
      currentLength += word.length + 1; // +1 for space
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}

export async function generateArticle(transcript: string) {
  const openai = getOpenAIClient();
  const settingsData = await db.query.settings.findFirst();

  // Split transcript into manageable chunks
  const chunks = splitTranscriptIntoChunks(transcript);

  // First, generate a summary from each chunk
  const summaries = await Promise.all(
    chunks.map(async (chunk) => {
      const response = await retryWithDelay(() =>
        openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Summarize the key points from this transcript segment concisely."
            },
            { role: "user", content: chunk }
          ],
          temperature: 0.7,
        })
      );
      return response.choices[0].message.content || '';
    })
  );

  // Combine summaries
  const combinedSummary = summaries.join('\n\n');

  // Generate the final article from the combined summary
  const systemPrompt = `You are an expert content writer. Generate an SEO-optimized article based on the provided summary.
Your response must be a valid JSON object with the following structure:
{
  "article": "the full article content",
  "titles": ["5 SEO optimized titles"],
  "metaDescription": "155 character meta description",
  "tags": ["at least 5 tags including primary keyword"],
  "primaryKeyword": "the main keyword",
  "seoScore": number between 0-100
}`;

  const userPrompt = `Write an article based on this summary:
${settingsData?.editorialGuidelines ? `\nEditorial Guidelines: ${settingsData.editorialGuidelines}` : ''}
${settingsData?.writingSamples?.length ? `\nWriting Style Reference: ${settingsData.writingSamples[0]}` : ''}

Summary:
${combinedSummary}`;

  try {
    const response = await retryWithDelay(() =>
      openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      })
    );

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return JSON.parse(content);
  } catch (error: any) {
    if (error instanceof SyntaxError) {
      console.error("Failed to parse OpenAI response:", error);
      throw new Error("Invalid response format from AI service");
    }
    throw error;
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
          content: "Generate 5 SEO-optimized titles for the article. Format response as: {\"titles\": [\"title1\", \"title2\", \"title3\", \"title4\", \"title5\"]}"
        },
        { role: "user", content }
      ]
    })
  );

  const responseContent = response.choices[0].message.content;
  if (!responseContent) {
    throw new Error("No content received from OpenAI");
  }

  try {
    return JSON.parse(responseContent).titles;
  } catch (error) {
    console.error("Failed to parse OpenAI response for titles:", error);
    throw new Error("Invalid title format from AI service");
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
          content: "Generate a compelling 155-character meta description. Format response as: {\"metaDescription\": \"your description here\"}"
        },
        { role: "user", content }
      ]
    })
  );

  const responseContent = response.choices[0].message.content;
  if (!responseContent) {
    throw new Error("No content received from OpenAI");
  }

  try {
    return JSON.parse(responseContent).metaDescription;
  } catch (error) {
    console.error("Failed to parse OpenAI response for meta description:", error);
    throw new Error("Invalid meta description format from AI service");
  }
}