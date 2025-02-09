import { YoutubeTranscript } from 'youtube-transcript';

export async function getTranscript(url: string): Promise<string> {
  try {
    console.log("Extracting video ID from URL:", url);
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error("Invalid YouTube URL. Please ensure you've entered a valid YouTube video URL.");
    }
    console.log("Extracted video ID:", videoId);

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcript || transcript.length === 0) {
      throw new Error("No transcript available for this video");
    }

    console.log(`Fetched transcript with ${transcript.length} segments`);
    const fullTranscript = transcript.map(item => item.text).join(' ');
    console.log(`Total transcript length: ${fullTranscript.length} characters`);

    return fullTranscript;
  } catch (error: any) {
    console.error("Transcript fetch error:", error);

    // Check for specific YouTube transcript errors
    if (error.message?.includes('Transcript is disabled')) {
      throw new Error(
        "This video has transcripts disabled. Please try a different video that has captions/transcripts enabled. " +
        "You can check if a video has transcripts by looking for the CC (Closed Captions) button in the YouTube player."
      );
    }

    if (error.message?.includes('Could not find automatic captions')) {
      throw new Error(
        "This video doesn't have automatic captions available. Please try a different video with captions enabled."
      );
    }

    throw new Error("Failed to fetch transcript: " + (error.message || "Unknown error occurred"));
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
        videoId = pathSegments[shortsIndex + 1].split('?')[0]; // Remove any query parameters
        console.log("Found video ID in shorts URL:", videoId);
        return videoId;
      }
    }

    // Handle youtu.be URLs
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.substring(1).split('?')[0]; // Remove any query parameters
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