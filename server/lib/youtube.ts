import { load } from "cheerio";

interface TranscriptResponse {
  transcript: string;
}

export async function getTranscript(url: string): Promise<string> {
  try {
    // This is a simplified version - in reality you'd want to use the YouTube API
    // or a dedicated transcript extraction library
    const response = await fetch(url);
    const html = await response.text();
    const $ = load(html);
    
    // Extract transcript from YouTube's automatically generated transcript
    // This is a placeholder implementation
    const transcript = $('div.ytd-transcript-renderer')
      .map((_, el) => $(el).text())
      .get()
      .join(' ');

    if (!transcript) {
      throw new Error('No transcript found');
    }

    return transcript;
  } catch (error) {
    throw new Error(`Failed to extract transcript: ${error.message}`);
  }
}
