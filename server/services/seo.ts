import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeSEO(content: string, metaDescription: string, titles: string[]) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analyze the SEO potential of the content and provide a score from 0-100 with detailed feedback. Output as JSON with fields: score, feedback",
        },
        {
          role: "user",
          content: JSON.stringify({ content, metaDescription, titles }),
        },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    throw new Error(`Failed to analyze SEO: ${error.message}`);
  }
}

export function generateTags(content: string, primaryKeyword: string): string[] {
  // Implementation of tag generation based on content analysis
  const tags = [primaryKeyword];
  // Add logic to extract relevant keywords and phrases
  return tags;
}