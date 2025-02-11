import OpenAI from "openai";
import { db } from "@db";
import { settings } from "@db/schema";
import { researchTopics, integrateContent } from "../lib/perplexity";
import fs from "fs";
import readline from "readline";
import { Stream } from "stream";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
const BASE_TOKENS_PER_CHUNK = 800;
const CHARS_PER_TOKEN = 4;
const MIN_CHUNK_SIZE = 500;
const MAX_CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

interface ComplexityMetrics {
  averageSentenceLength: number;
  technicalTermsRatio: number;
  specialCharRatio: number;
  complexityScore: number;
}

function analyzeTextComplexity(text: string): ComplexityMetrics {
  // Split into sentences (basic implementation)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);

  // Calculate average sentence length
  const averageSentenceLength = words.length / sentences.length;

  // Count technical terms (simplified - words longer than 8 chars)
  const technicalTerms = words.filter(w => w.length > 8).length;
  const technicalTermsRatio = technicalTerms / words.length;

  // Count special characters
  const specialChars = text.replace(/[a-zA-Z0-9\s]/g, '').length;
  const specialCharRatio = specialChars / text.length;

  // Calculate overall complexity score (0-1)
  const complexityScore = (
    (Math.min(averageSentenceLength / 30, 1) * 0.4) +
    (technicalTermsRatio * 0.4) +
    (specialCharRatio * 0.2)
  );

  return {
    averageSentenceLength,
    technicalTermsRatio,
    specialCharRatio,
    complexityScore
  };
}

function getAdaptiveChunkSize(complexity: number): number {
  // Adjust chunk size inversely to complexity
  const adaptiveSize = BASE_TOKENS_PER_CHUNK * (1 - (complexity * 0.5));
  return Math.max(
    MIN_CHUNK_SIZE,
    Math.min(MAX_CHUNK_SIZE, Math.round(adaptiveSize))
  );
}

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
  let complexityMetrics: ComplexityMetrics | null = null;
  let wordCount = 0;
  let totalWordCount = 0;

  console.log("Starting to process file in chunks...");

  for await (const line of rl) {
    // Analyze complexity after gathering some content
    if (!complexityMetrics && paragraphBuffer.length > 500) {
      complexityMetrics = analyzeTextComplexity(paragraphBuffer);
      console.log("Content complexity analysis:", complexityMetrics);
    }

    // Determine chunk size based on complexity
    const currentMaxTokens = complexityMetrics
      ? getAdaptiveChunkSize(complexityMetrics.complexityScore)
      : BASE_TOKENS_PER_CHUNK;

    if (line.trim() === '') {
      if (paragraphBuffer) {
        const paragraph = paragraphBuffer.trim();
        const paragraphTokens = Math.ceil(paragraph.length / CHARS_PER_TOKEN);
        const paragraphWords = paragraph.split(/\s+/).length;

        if (wordCount + paragraphWords > 800 || estimatedTokens + paragraphTokens > currentMaxTokens) {
          previousChunkEnd = currentChunk.split('\n').slice(-3).join('\n');
          console.log(`Yielding chunk with ${wordCount} words (${estimatedTokens} tokens). Total words processed: ${totalWordCount}`);
          yield currentChunk;

          currentChunk = previousChunkEnd + '\n\n' + paragraph;
          estimatedTokens = Math.ceil(previousChunkEnd.length / CHARS_PER_TOKEN) + paragraphTokens;
          wordCount = previousChunkEnd.split(/\s+/).length + paragraphWords;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
          estimatedTokens += paragraphTokens;
          wordCount += paragraphWords;
        }

        totalWordCount += paragraphWords;
        paragraphBuffer = '';
      }
    } else {
      paragraphBuffer += (paragraphBuffer ? ' ' : '') + line;
    }
  }

  // Handle any remaining content
  if (paragraphBuffer) {
    const paragraph = paragraphBuffer.trim();
    currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    totalWordCount += paragraph.split(/\s+/).length;
  }

  if (currentChunk.trim()) {
    console.log(`Yielding final chunk. Total words processed: ${totalWordCount}`);
    yield currentChunk;
  }

  console.log(`Finished processing file. Total words processed: ${totalWordCount}`);
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

export async function improveContent(content: string, transcript: string): Promise<string> {
  const openai = getOpenAIClient();

  try {
    const response = await retryWithDelay(() =>
      openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert content editor. Compare the article with the original transcript 
            and improve it by:
            1. Identifying and adding any important information from the transcript that's missing in the article
            2. Removing any source citations or reference markers (e.g., [1], [source])
            3. Ensuring the content flows naturally and maintains a consistent tone
            4. Preserving the article's structure while integrating the missing information

            Return only the improved article content.`
          },
          {
            role: "user",
            content: `Current article:
            ${content}

            Original transcript:
            ${transcript}`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      })
    );

    const improvedContent = response.choices[0].message.content;
    if (!improvedContent) {
      throw new Error("No content received from OpenAI");
    }

    return improvedContent;
  } catch (error: any) {
    console.error("Content improvement error:", error);
    throw new Error(`Failed to improve content: ${error.message}`);
  }
}

export async function generateArticle(transcriptFilePath: string): Promise<GenerationResult> {
  const openai = getOpenAIClient();
  const settingsData = await db.query.settings.findFirst();

  try {
    console.log("Processing transcript file in chunks...");
    const summaries: string[] = [];
    const generationChunks: GenerationChunk[] = [];
    let chunkCount = 0;
    let totalWords = 0;
    let previousSummaryEnd = '';

    for await (const chunk of readFileInChunks(transcriptFilePath)) {
      chunkCount++;
      const chunkWords = chunk.split(/\s+/).length;
      totalWords += chunkWords;
      console.log(`Processing chunk ${chunkCount}, size: ${chunkWords} words (total words: ${totalWords})`);

      try {
        const response = await retryWithDelay(() =>
          openai.chat.completions.create({
            model: "gpt-4-1106-preview",
            messages: [
              {
                role: "system",
                content: `You are an expert content writer tasked with creating a detailed summary of this transcript segment.
                         Key requirements:
                         1. Maintain all important information, examples, and specific details
                         2. Use descriptive language and expand on technical concepts
                         3. If this is not the first chunk, seamlessly integrate with: ${previousSummaryEnd}
                         4. Focus on creating comprehensive, publication-ready content
                         5. Preserve quotes, statistics, and specific examples
                         Do not include citation markers or reference numbers.`
              },
              { role: "user", content: chunk }
            ],
            temperature: 0.7,
            max_tokens: 3000
          })
        );

        const summary = response.choices[0].message.content;
        if (summary) {
          previousSummaryEnd = summary.split('\n').slice(-3).join('\n');
          summaries.push(summary);
          console.log(`Generated summary length: ${summary.length} characters`);

          generationChunks.push({
            originalText: chunk,
            summary: summary,
            position: chunkCount - 1
          });

          console.log(`Successfully processed chunk ${chunkCount} of ${chunkWords} words`);
        }
      } catch (error: any) {
        console.error(`Error processing chunk ${chunkCount}:`, error);
        throw error;
      }
    }

    console.log(`Successfully processed ${chunkCount} chunks (${totalWords} total words). Extracting key topics...`);

    // Extract key topics for research
    const topicsResponse = await retryWithDelay(() =>
      openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
          {
            role: "system",
            content: "Analyze the transcript summaries and identify 3-5 key topics that would benefit from additional research. Format the response as a JSON object with a 'topics' array containing the identified topics."
          },
          {
            role: "user",
            content: summaries.join('\n\n')
          }
        ],
        response_format: { type: "json_object" }
      })
    );

    const topicsData = JSON.parse(topicsResponse.choices[0].message.content || "{}");
    const keyTopics: string[] = topicsData.topics || [];

    console.log("Researching additional content for key topics...");
    const researchResults = await researchTopics(keyTopics);

    console.log("Generating comprehensive article with integrated research...");
    const initialResponse = await retryWithDelay(() =>
      openai.chat.completions.create({
        model: "gpt-4-1106-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert content writer creating a comprehensive, long-form article.

            Requirements:
            1. Create a detailed, thorough article that fully explores all topics
            2. Maintain depth and detail from the original transcript
            3. Include specific examples, quotes, and technical details
            4. Seamlessly integrate transcript content with research information
            5. Use clear section headings and proper article structure
            6. Aim for a comprehensive long-form article (2000-3000 words)
            7. Do not include citations or reference numbers

            Format the response as a JSON object with:
            {
              "article": "the detailed article content",
              "titles": ["5 SEO optimized titles"],
              "metaDescription": "155 character meta description",
              "tags": ["at least 5 tags including primary keyword"],
              "keyTopics": ["main topics covered"],
              "missingTopics": ["topics needing more detail"],
              "seoScore": number between 0-100
            }`
          },
          {
            role: "user",
            content: `Create a comprehensive article by integrating these transcript summaries and research:

            Transcript content:
            ${summaries.join('\n\n')}

            Additional research:
            ${researchResults.map(r => r.content).join('\n\n')}

            ${settingsData?.editorialGuidelines ? `\nUse these editorial guidelines: ${settingsData.editorialGuidelines}` : ''}
            ${settingsData?.writingSamples?.length ? `\nReference this writing style: ${settingsData.writingSamples[0]}` : ''}`
          }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    );

    const result = JSON.parse(initialResponse.choices[0].message.content || "{}");
    console.log(`Generated article length: ${result.article.length} characters`);

    const improvedArticle = await improveContent(result.article, summaries.join('\n\n'));
    
    return {
      ...result,
      article: improvedArticle,
      generationChunks
    };

  } catch (error: any) {
    console.error("Article generation error:", error);
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
    return JSON.parse(responseContent).titles;
  } catch (error) {
    console.error("Failed to parse OpenAI response for titles:", error);
    throw new Error("Invalid title format from AI service");
  }
}