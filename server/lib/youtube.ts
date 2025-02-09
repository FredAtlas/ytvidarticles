import { YoutubeTranscript } from 'youtube-transcript';
import { generateTranscript } from '../services/transcription';

export async function getTranscript(url: string): Promise<string> {
  try {
    console.log("Extracting video ID from URL:", url);
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error("Invalid YouTube URL. Please ensure you've entered a valid YouTube video URL.");
    }
    console.log("Extracted video ID:", videoId);

    try {
      // First attempt: Try getting transcript via YouTube's API
      console.log("Attempting to fetch YouTube captions...");
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);
      if (transcriptItems && transcriptItems.length > 0) {
        console.log("Successfully fetched YouTube captions");
        return transcriptItems
          .map(item => item.text)
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    } catch (error: any) {
      console.log("YouTube captions not available, falling back to audio transcription...");
      if (error.message.includes("Transcript is disabled")) {
        // Fall back to audio transcription
        console.log("Attempting audio transcription...");
        const transcript = await generateTranscript(url);
        if (transcript) {
          console.log("Successfully generated transcript from audio");
          return transcript;
        }
      } else {
        // If it's not a disabled transcript error, rethrow
        throw error;
      }
    }

    throw new Error("Failed to generate transcript. Please ensure the video either has closed captions enabled or is accessible for audio download.");
  } catch (error: any) {
    console.error("Transcript generation error:", error);
    throw new Error(`Failed to generate transcript: ${error.message}`);
  }
}

function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    let videoId: string | null = null;

    // Handle youtube.com URLs
    if (urlObj.hostname.includes('youtube.com')) {
      // Handle standard video URLs
      videoId = urlObj.searchParams.get('v');
      if (videoId) {
        console.log("Found video ID in query params:", videoId);
        return videoId;
      }

      // Handle shorts URLs
      const pathSegments = urlObj.pathname.split('/');
      const shortsIndex = pathSegments.indexOf('shorts');
      if (shortsIndex !== -1 && pathSegments[shortsIndex + 1]) {
        videoId = pathSegments[shortsIndex + 1].split('?')[0];
        console.log("Found video ID in shorts URL:", videoId);
        return videoId;
      }
    }

    // Handle youtu.be URLs
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.substring(1).split('?')[0];
      if (videoId) {
        console.log("Found video ID in youtu.be URL:", videoId);
        return videoId;
      }
    }

    console.log("No video ID found in URL");
    return null;
  } catch (error) {
    console.error("Error extracting video ID:", error);
    return null;
  }
}