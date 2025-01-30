import OpenAI from "openai";
import { db } from "@db";
import { settings } from "@db/schema";
import fs from "fs";

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

function splitFileIntoChunks(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const sentences = content.match(/[^.!?]+[.!?]+/g) || [content];
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

export async function generateArticle(transcriptFilePath: string) {
  const openai = getOpenAIClient();
  const settingsData = await db.query.settings.findFirst();

  try {
    // Split file content into chunks
    console.log("Splitting transcript file into chunks...");
    const chunks = splitFileIntoChunks(transcriptFilePath);
    console.log(`Processing transcript in ${chunks.length} chunks`);

    // Step 1: Generate comprehensive summaries for each chunk
    console.log("Generating summaries for each chunk...");
    const summaries = await Promise.all(
      chunks.map(async (chunk, index) => {
        console.log(`Processing chunk ${index + 1}/${chunks.length}`);
        const response = await retryWithDelay(() =>
          openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `You are a detailed content analyzer. Create a comprehensive summary of this transcript segment, ensuring to:
                1. Preserve all important facts, figures, and statistics
                2. Keep meaningful quotes and key statements
                3. Maintain the logical flow and connections between ideas
                4. Include specific examples and case studies mentioned
                5. Capture any step-by-step instructions or processes`
              },
              { role: "user", content: chunk }
            ],
            temperature: 0.7,
          })
        );
        return response.choices[0].message.content || '';
      })
    );

    // Step 2: Combine summaries with structure
    console.log("Combining summaries into structured content...");
    const combinedSummary = summaries.join('\n\n');

    // Step 3: Generate final article
    console.log("Generating final article...");
    const response = await retryWithDelay(() =>
      openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert content writer. Create a detailed, well-structured article from this summary.
            Follow these requirements:
            1. Maintain the depth and comprehensiveness of the original content
            2. Include all important facts, figures, and statistics
            3. Preserve meaningful quotes and key statements
            4. Create a clear, logical structure with proper transitions
            5. Use subheadings to organize different topics

            Your response must follow this format exactly:
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
            content: `Create a comprehensive article based on this summary following any editorial guidelines provided:
            ${settingsData?.editorialGuidelines ? `\nGuidelines: ${settingsData.editorialGuidelines}` : ''}
            ${settingsData?.writingSamples?.length ? `\nStyle Reference: ${settingsData.writingSamples[0]}` : ''}

            Summary:
            ${combinedSummary}`
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
      // Clean up the response and parse JSON
      const cleanedContent = content
        .replace(/```json\s?|\s?```/g, '') // Remove code blocks
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ''); // Remove control characters

      console.log("Parsing OpenAI response...");
      const parsedContent = JSON.parse(cleanedContent);

      // Validate the response structure
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