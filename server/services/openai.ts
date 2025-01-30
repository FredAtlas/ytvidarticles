import OpenAI from "openai";
import { db } from "@db";
import { settings } from "@db/schema";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MAX_CHUNK_LENGTH = 6000;

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
      currentLength += word.length + 1;
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
  try {
    const response = await retryWithDelay(() =>
      openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert content writer. Generate an SEO-optimized article based on the provided summary. 
            Include the following in your response:
            - A complete article
            - 5 SEO optimized titles
            - A 155-character meta description
            - At least 5 tags including a primary keyword
            - A primary keyword
            - An SEO score between 0-100

            Start your response with '{"article": "' and make sure all content is properly JSON escaped.`
          },
          {
            role: "user",
            content: `Write an article based on this summary:
${settingsData?.editorialGuidelines ? `\nEditorial Guidelines: ${settingsData.editorialGuidelines}` : ''}
${settingsData?.writingSamples?.length ? `\nWriting Style Reference: ${settingsData.writingSamples[0]}` : ''}

Summary:
${combinedSummary}`
          }
        ],
        temperature: 0.7,
      })
    );

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    try {
      // Remove any markdown formatting or code blocks that might be in the response
      const cleanedContent = content.replace(/```json\n?|\n?```/g, '');
      console.log("Attempting to parse OpenAI response:", cleanedContent);
      return JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Raw response:", content);
      throw new Error("Invalid response format from AI service");
    }
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
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