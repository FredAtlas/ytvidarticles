import OpenAI from "openai";
import { db } from "@db";
import { settings } from "@db/schema";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MAX_CHUNK_SIZE = 4000; // Reduced chunk size to stay within token limits

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

function splitTranscriptIntoChunks(transcript: string): string[] {
  const sentences = transcript.match(/[^.!?]+[.!?]+/g) || [transcript];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > MAX_CHUNK_SIZE) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += ' ' + sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

export async function generateArticle(transcript: string) {
  const openai = getOpenAIClient();
  const settingsData = await db.query.settings.findFirst();

  const prompt = `
You are an expert content writer. Generate an SEO-optimized article based on this video transcript.
${settingsData?.editorialGuidelines ? `Follow these editorial guidelines: ${settingsData.editorialGuidelines}` : ''}
${settingsData?.writingSamples?.length ? `Use these writing samples as reference for tone and style: ${settingsData.writingSamples.join('\n')}` : ''}

Format your response as a valid JSON object with the following structure:
{
  "article": "the full article content",
  "titles": ["5 SEO optimized titles"],
  "metaDescription": "155 character meta description",
  "tags": ["at least 5 tags including primary keyword"],
  "primaryKeyword": "the main keyword",
  "seoScore": number between 0-100
}

Here is the transcript to analyze and convert into an article:
${transcript}

Remember to maintain the factual accuracy and key points from the transcript while creating an engaging article.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
  });

  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No content received from OpenAI");
  }

  try {
    // Clean the response of any markdown formatting and validate JSON
    const cleanedContent = content
      .replace(/```json\s?|\s?```/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

    const parsedContent = JSON.parse(cleanedContent);

    // Validate required fields
    const requiredFields = ['article', 'titles', 'metaDescription', 'tags', 'primaryKeyword', 'seoScore'];
    const missingFields = requiredFields.filter(field => !(field in parsedContent));

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in response: ${missingFields.join(', ')}`);
    }

    return parsedContent;
  } catch (error) {
    console.error('Error parsing OpenAI response:', error);
    throw new Error('Failed to generate properly formatted article. Please try again.');
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
          content: "Generate 5 SEO-optimized titles for the article. Format your response as a JSON array of strings, starting with '[\"' and ending with '\"]'"
        },
        { role: "user", content }
      ],
    })
  );

  const responseContent = response.choices[0].message.content;
  if (!responseContent) {
    throw new Error("No content received from OpenAI");
  }

  try {
    const cleanedContent = responseContent.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanedContent);
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
          content: "Generate a compelling 155-character meta description. Format your response as a JSON object with a 'metaDescription' field."
        },
        { role: "user", content }
      ],
    })
  );

  const responseContent = response.choices[0].message.content;
  if (!responseContent) {
    throw new Error("No content received from OpenAI");
  }

  try {
    const cleanedContent = responseContent.replace(/```json\n?|\n?```/g, '');
    return JSON.parse(cleanedContent).metaDescription;
  } catch (error) {
    console.error("Failed to parse OpenAI response for meta description:", error);
    throw new Error("Invalid meta description format from AI service");
  }
}