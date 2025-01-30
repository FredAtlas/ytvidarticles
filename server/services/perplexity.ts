async function refineContent(content: string, writingSamples: string[]) {
  const samples = writingSamples.join("\n\n");
  
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-sonar-small-128k-online",
      messages: [
        {
          role: "system",
          content: `You are an expert content writer. Analyze the writing samples below and rewrite the given content to match their style and tone, while maintaining SEO optimization:\n\n${samples}`,
        },
        {
          role: "user",
          content,
        },
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.statusText}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

export { refineContent };
