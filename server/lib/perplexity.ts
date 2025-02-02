import { db } from "@db";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ResearchTopic {
  topic: string;
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

export async function researchTopics(topics: string[]): Promise<ResearchTopic[]> {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("Perplexity API key not configured in environment variables");
  }

  const results: ResearchTopic[] = [];

  for (const topic of topics) {
    const messages: Message[] = [
      {
        role: "system",
        content: "You are a research expert. Search the web and provide detailed, factual information about the topic. Include recent developments, statistics, and expert insights. Format the response as a well-structured article section."
      },
      {
        role: "user",
        content: `Research this topic in detail: ${topic}`
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
        max_tokens: 4000,
        search_domain_filter: ["wikipedia.org", "arxiv.org", "scholar.google.com"],
        return_citations: true,
        search_recency_filter: "month"
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to research topic: ${topic}`);
    }

    const data = await response.json();
    results.push({
      topic,
      content: data.choices[0].message.content
    });
  }

  return results;
}

export async function integrateContent(existingArticle: string, newSection: string) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    throw new Error("Perplexity API key not configured in environment variables");
  }

  const messages: Message[] = [
    {
      role: "system",
      content: `You are an expert content editor. Your task is to seamlessly integrate new content into an existing article.
      1. Analyze both the existing article and new content
      2. Find the most appropriate place to insert the new content
      3. Rewrite transitions to maintain flow
      4. Create new sections if needed
      5. Return the complete integrated article
      Format the response as natural article text without any special markers or JSON.`
    },
    {
      role: "user",
      content: `Existing article:\n${existingArticle}\n\nNew content to integrate:\n${newSection}`
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
    throw new Error("Failed to integrate content");
  }

  const data = await response.json();
  return data.choices[0].message.content;
}