import { db } from "@db";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function humanizeContent(content: string) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("Perplexity API key not configured in environment variables");
  }

  const messages: Message[] = [
    {
      role: "system",
      content: "You are an expert writer. Make the following content more human-like and natural while preserving SEO optimization."
    },
    {
      role: "user",
      content
    }
  ];

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-small-128k-online",
      messages,
      temperature: 0.7,
      max_tokens: 4000
    })
  });

  if (!response.ok) {
    throw new Error("Failed to humanize content");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}