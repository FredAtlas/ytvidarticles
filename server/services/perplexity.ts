async function refineContent(content: string, writingSamples: string[] = []) {
  const samples = writingSamples.join("\n\n");
  const formatGuide = `
Format requirements:
- Paragraphs: 1-4 sentences maximum
- Sentences: 70% under 25 words, 30% under 35 words
- Content blocks: Visual break every 200-300 words
- Key information density: One unique insight every 150-200 words

Additional guidelines:
- Remove duplicate conclusions
- Combine related sections
- Ensure seamless transitions
- Maintain consistent flow`;
  
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
          content: `You are an expert content writer and editor. Rewrite and restructure the content following these requirements:${formatGuide}\n\nStyle reference:${samples}`,
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
