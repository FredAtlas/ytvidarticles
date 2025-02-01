import OpenAI from "openai";
import { db } from "@db";
import { settings } from "@db/schema";
import fs from "fs";
import readline from "readline";
import { Stream } from "stream";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MAX_TOKENS_PER_CHUNK = 1500; // Reduced for safety margin
const CHARS_PER_TOKEN = 4;
const MAX_CHUNK_SIZE = MAX_TOKENS_PER_CHUNK * CHARS_PER_TOKEN;
const CHUNK_OVERLAP = 500; // Balanced overlap for context

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
  let previousChunkEnd = '';
  let estimatedTokens = 0;
  let paragraphBuffer = '';

  for await (const line of rl) {
    // Add line to paragraph buffer until we hit a blank line or paragraph break
    if (line.trim() === '') {
      if (paragraphBuffer) {
        const paragraph = paragraphBuffer.trim();
        const paragraphTokens = Math.ceil(paragraph.length / CHARS_PER_TOKEN) + 10;

        // If adding this paragraph would exceed our token limit
        if (estimatedTokens + paragraphTokens > MAX_TOKENS_PER_CHUNK) {
          // Keep track of the end of the current chunk for overlap
          previousChunkEnd = currentChunk.split('\n').slice(-3).join('\n');

          console.log(`Yielding chunk with estimated ${estimatedTokens} tokens`);
          yield currentChunk;

          // Start new chunk with overlap from previous chunk
          currentChunk = previousChunkEnd + '\n\n' + paragraph;
          estimatedTokens = Math.ceil(previousChunkEnd.length / CHARS_PER_TOKEN) + paragraphTokens;
        } else {
          // Add paragraph to current chunk
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
          estimatedTokens += paragraphTokens;
        }

        paragraphBuffer = '';
      }
    } else {
      paragraphBuffer += (paragraphBuffer ? ' ' : '') + line;
    }

    // Force chunk break if we're getting close to the limit
    if (estimatedTokens > MAX_TOKENS_PER_CHUNK * 0.7) {
      previousChunkEnd = currentChunk.split('\n').slice(-3).join('\n');
      console.log(`Forcing chunk break at ${estimatedTokens} tokens (70% of limit)`);
      yield currentChunk;
      currentChunk = previousChunkEnd + '\n\n';
      estimatedTokens = Math.ceil(previousChunkEnd.length / CHARS_PER_TOKEN);
    }
  }

  // Process any remaining paragraph in the buffer
  if (paragraphBuffer) {
    const paragraph = paragraphBuffer.trim();
    currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
  }

  // Yield final chunk if not empty
  if (currentChunk.trim()) {
    yield currentChunk;
  }
}

interface GenerationChunk {
  originalText: string;
  summary: string;
  position: number;
}

export interface GenerationResult {
  article: string;
  titles: string[];
  metaDescription: string;
  tags: string[];
  keyTopics: string[];
  missingTopics: string[];
  seoScore: number;
  generationChunks: GenerationChunk[];
}

export async function generateArticle(transcriptFilePath: string): Promise<GenerationResult> {
  const openai = getOpenAIClient();
  const settingsData = await db.query.settings.findFirst();

  try {
    console.log("Processing transcript file in chunks...");
    const summaries: string[] = [];
    const generationChunks: GenerationChunk[] = [];
    let chunkCount = 0;
    let previousSummaryEnd = '';

    // Process file in chunks with improved context handling
    for await (const chunk of readFileInChunks(transcriptFilePath)) {
      chunkCount++;
      console.log(`Processing chunk ${chunkCount}, approximate size: ${chunk.length} characters`);

      try {
        const response = await retryWithDelay(() =>
          openai.chat.completions.create({
            model: "gpt-4-1106-preview",
            messages: [
              {
                role: "system",
                content: `Create a detailed summary of this transcript segment, ensuring no important information is lost.
                         If this is not the first chunk, incorporate it seamlessly with: ${previousSummaryEnd}
                         Focus on maintaining narrative flow and context.
                         Length: Keep it under 1000 words while preserving all key information.
                         Also identify any key topics and concepts discussed in this segment.`
              },
              { role: "user", content: chunk }
            ],
            temperature: 0.7,
            max_tokens: 1500,
          })
        );

        const summary = response.choices[0].message.content;
        if (summary) {
          // Keep track of the end of this summary for context in next chunk
          previousSummaryEnd = summary.split('\n').slice(-3).join('\n');
          summaries.push(summary);

          // Store chunk information
          generationChunks.push({
            originalText: chunk,
            summary: summary,
            position: chunkCount - 1
          });

          console.log(`Successfully processed chunk ${chunkCount}`);
        }
      } catch (error: any) {
        console.error(`Error processing chunk ${chunkCount}:`, error);
        throw error;
      }
    }

    console.log(`Successfully processed ${chunkCount} chunks. Generating final article...`);

    // Generate final article with all the content
    const response = await retryWithDelay(() =>
      openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert content writer. Your task is to create a comprehensive article from the provided summaries.
            Your response must be in JSON format with the following structure:
            {
              "article": "comprehensive article content with proper formatting",
              "titles": ["title1", "title2", "title3", "title4", "title5"],
              "metaDescription": "155-character meta description",
              "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
              "keyTopics": ["topic1", "topic2"],
              "missingTopics": ["topic1", "topic2"],
              "seoScore": 85
            }

            Requirements:
            1. Maintain depth and comprehensiveness
            2. Include all important facts and statistics
            3. Create clear structure with transitions
            4. Use subheadings to organize topics
            5. Ensure natural flow and consistency`
          },
          {
            role: "user",
            content: `Create a comprehensive article based on these transcript summaries:
            ${summaries.join('\n\n')}

            ${settingsData?.editorialGuidelines ? `\nUse these editorial guidelines for style and tone: ${settingsData.editorialGuidelines}` : ''}
            ${settingsData?.writingSamples?.length ? `\nReference this writing style: ${settingsData.writingSamples[0]}` : ''}`
          }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      })
    );

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    try {
      console.log("Parsing OpenAI response...");
      const parsedContent = JSON.parse(content);

      const requiredFields = [
        'article', 'titles', 'metaDescription', 'tags',
        'keyTopics', 'missingTopics', 'seoScore'
      ];

      const missingFields = requiredFields.filter(field => !(field in parsedContent));
      if (missingFields.length > 0) {
        throw new Error(`Invalid response structure. Missing fields: ${missingFields.join(', ')}`);
      }

      return {
        ...parsedContent,
        generationChunks
      };
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