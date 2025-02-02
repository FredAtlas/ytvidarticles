import OpenAI from "openai";

interface SocialMediaContent {
  twitter: {
    tweets: string[];
    hashtags: string[];
  };
  linkedin: {
    post: string;
    bullet_points: string[];
  };
  facebook: {
    post: string;
    key_points: string[];
  };
  instagram: {
    caption: string;
    hashtags: string[];
  };
}

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured in environment variables");
  }
  return new OpenAI({ apiKey });
};

export async function generateSocialMediaContent(article: string): Promise<SocialMediaContent> {
  const openai = getOpenAIClient();

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: `Generate engaging social media content from the article. Format the response as a JSON object with the following structure:
          {
            "twitter": {
              "tweets": ["tweet1", "tweet2", "tweet3"],
              "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
            },
            "linkedin": {
              "post": "professional post content",
              "bullet_points": ["point1", "point2", "point3"]
            },
            "facebook": {
              "post": "engaging post content",
              "key_points": ["point1", "point2", "point3"]
            },
            "instagram": {
              "caption": "engaging caption",
              "hashtags": ["hashtag1", "hashtag2", "hashtag3"]
            }
          }
          
          Guidelines:
          - Twitter: Create 3 tweet-sized messages (280 chars max each)
          - LinkedIn: Professional tone, business-focused
          - Facebook: Conversational, engaging style
          - Instagram: Visual-friendly, engaging caption with relevant hashtags
          - Include relevant hashtags for Twitter and Instagram
          - Ensure content is optimized for each platform's audience`
        },
        {
          role: "user",
          content: article
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content received from OpenAI");
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error("Failed to generate social media content:", error);
    throw new Error(`Error generating social media content: ${error.message}`);
  }
}

export async function optimizeSocialMediaPost(platform: string, content: string): Promise<string> {
  const openai = getOpenAIClient();

  const platformGuidelines = {
    twitter: "280 character limit, engaging and concise",
    linkedin: "Professional tone, business insights, industry relevance",
    facebook: "Conversational, engaging, community-focused",
    instagram: "Visual-friendly, engaging, lifestyle-oriented"
  };

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: `Optimize this content for ${platform} following these guidelines: ${platformGuidelines[platform as keyof typeof platformGuidelines]}`
        },
        {
          role: "user",
          content
        }
      ]
    });

    return response.choices[0].message.content || content;
  } catch (error: any) {
    console.error(`Failed to optimize ${platform} content:`, error);
    return content;
  }
}
