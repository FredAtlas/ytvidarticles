import OpenAI from "openai";
import { db } from "@db";
import { settings } from "@db/schema";
import fs from "fs";
import readline from "readline";
import { Stream } from "stream";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MAX_TOKENS_PER_CHUNK = 1000; // Reduced from 1500 to be more conservative
const CHARS_PER_TOKEN = 4; // Approximate characters per token
const MAX_CHUNK_SIZE = MAX_TOKENS_PER_CHUNK * CHARS_PER_TOKEN;

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

async function* readFileInChunks(filePath: string): AsyncGenerator<string> {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let currentChunk = '';
  let estimatedTokens = 0;

  for await (const line of rl) {
    // Estimate tokens in current line (including punctuation and special characters)
    const lineTokens = Math.ceil(line.length / CHARS_PER_TOKEN) + 2; // +2 for safety margin

    // If adding this line would exceed our token limit
    if (estimatedTokens + lineTokens > MAX_TOKENS_PER_CHUNK) {
      if (currentChunk) {
        // Log chunk size for debugging
        console.log(`Yielding chunk with estimated ${estimatedTokens} tokens`);
        yield currentChunk;
        currentChunk = '';
        estimatedTokens = 0;
      }
    }

    // Add line to current chunk
    currentChunk += (currentChunk ? '\n' : '') + line;
    estimatedTokens += lineTokens;

    // Force chunk break if we're getting close to the limit
    if (estimatedTokens > MAX_TOKENS_PER_CHUNK * 0.9) {
      console.log(`Forcing chunk break at ${estimatedTokens} tokens (90% of limit)`);
      yield currentChunk;
      currentChunk = '';
      estimatedTokens = 0;
    }
  }

  // Yield final chunk if there's anything left
  if (currentChunk) {
    console.log(`Yielding final chunk with estimated ${estimatedTokens} tokens`);
    yield currentChunk;
  }
}

export async function generateArticle(transcriptFilePath: string) {
  const openai = getOpenAIClient();
  const settingsData = await db.query.settings.findFirst();

  try {
    console.log("Processing transcript file in chunks...");
    const summaries: string[] = [];
    let chunkCount = 0;

    // Process file in chunks
    for await (const chunk of readFileInChunks(transcriptFilePath)) {
      chunkCount++;
      console.log(`Processing chunk ${chunkCount}, approximate size: ${chunk.length} characters`);

      try {
        const response = await retryWithDelay(() =>
          openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "Create a brief, focused summary of this transcript segment. Focus on key points only."
              },
              { role: "user", content: chunk }
            ],
            temperature: 0.7,
          })
        );

        const summary = response.choices[0].message.content;
        if (summary) {
          summaries.push(summary);
          console.log(`Successfully processed chunk ${chunkCount}`);
        }
      } catch (error: any) {
        console.error(`Error processing chunk ${chunkCount}:`, error);
        if (error.response?.status === 400 && error.response?.data?.error?.code === 'context_length_exceeded') {
          console.log(`Token limit exceeded for chunk ${chunkCount}, attempting to split chunk further`);
          // Split the problematic chunk in half and try again
          const halfLength = Math.floor(chunk.length / 2);
          const firstHalf = chunk.slice(0, halfLength);
          const secondHalf = chunk.slice(halfLength);

          // Process each half
          for (const subChunk of [firstHalf, secondHalf]) {
            const retryResponse = await retryWithDelay(() =>
              openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                  {
                    role: "system",
                    content: "Create a brief, focused summary of this transcript segment. Focus on key points only."
                  },
                  { role: "user", content: subChunk }
                ],
                temperature: 0.7,
              })
            );

            if (retryResponse.choices[0].message.content) {
              summaries.push(retryResponse.choices[0].message.content);
            }
          }
        } else {
          throw error;
        }
      }
    }

    console.log(`Successfully processed ${chunkCount} chunks. Generating final article...`);

    // Generate final article from all summaries
    const response = await retryWithDelay(() =>
      openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert content writer. Create a detailed, well-structured article from these summaries.
            Follow these requirements:
            1. Maintain the depth and comprehensiveness of the original content
            2. Include all important facts, figures, and statistics
            3. Create a clear, logical structure with proper transitions
            4. Use subheadings to organize different topics

            Format your response as a JSON object with the following structure:
            {
              "article": "your comprehensive article content with proper formatting and structure",
              "titles": ["title1", "title2", "title3", "title4", "title5"],
              "metaDescription": "your 155 char meta description",
              "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
              "primaryKeyword": "main keyword",
              "seoScore": number
            }`
          },
          {
            role: "user",
            content: `Create a comprehensive article based on these summaries following the editorial guidelines:
            ${settingsData?.editorialGuidelines ? `\nGuidelines: ${settingsData.editorialGuidelines}` : ''}
            ${settingsData?.writingSamples?.length ? `\nStyle Reference: ${settingsData.writingSamples[0]}` : ''}

            Summaries:
            ${summaries.join('\n\n')}`
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
      const cleanedContent = content
        .replace(/```json\s?|\s?```/g, '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');

      console.log("Parsing OpenAI response...");
      const parsedContent = JSON.parse(cleanedContent);

      const requiredFields = ['article', 'titles', 'metaDescription', 'tags', 'primaryKeyword', 'seoScore'];
      const missingFields = requiredFields.filter(field => !(field in parsedContent));

      if (missingFields.length > 0) {
        throw new Error(`Invalid response structure. Missing fields: ${missingFields.join(', ')}`);
      }

      return parsedContent;
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", parseError);
      console.error("Raw response:", content);
      throw new Error("Failed to parse AI response into required format");
    }
  } catch (error: any) {
    console.error("OpenAI API Error:", error);
    throw new Error(`Failed to generate article: ${error.message}`);
  }
}

export async function generateTitles(content: string) {
  const openai = getOpenAIClient();

  const response = await retryWithDelay(() =>
    openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: "Generate 5 SEO-optimized titles for the article. Format your response as a JSON array of strings."
        },
        { role: "user", content }
      ],
      response_format: { type: "json_object" }
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