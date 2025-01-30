import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateArticle(transcript: string, guidelines: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert content writer. Create an SEO-optimized article based on the provided transcript following these guidelines: ${guidelines}. Output in JSON format with fields: content, primaryKeyword`,
        },
        { role: "user", content: transcript },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

export async function generateTitles(content: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate 5 SEO-optimized titles for the article. Output as JSON array.",
        },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content).titles;
  } catch (error) {
    throw new Error(`Failed to generate titles: ${error.message}`);
  }
}

export async function generateMetaDescription(content: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate a compelling 155-character meta description. Output as JSON with field: metaDescription",
        },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content).metaDescription;
  } catch (error) {
    throw new Error(`Failed to generate meta description: ${error.message}`);
  }
}
