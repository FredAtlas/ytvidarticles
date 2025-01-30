import { YoutubeTranscript } from 'youtube-transcript';

export async function getTranscript(url: string): Promise<string> {
  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map(item => item.text).join(' ');
  } catch (error) {
    throw new Error("Failed to fetch transcript: " + (error as Error).message);
  }
}

function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Handle youtube.com URLs
    if (urlObj.hostname.includes('youtube.com')) {
      // Handle standard video URLs
      const searchParams = urlObj.searchParams.get('v');
      if (searchParams) return searchParams;

      // Handle shorts URLs
      const pathSegments = urlObj.pathname.split('/');
      const shortsIndex = pathSegments.indexOf('shorts');
      if (shortsIndex !== -1 && pathSegments[shortsIndex + 1]) {
        return pathSegments[shortsIndex + 1];
      }
    }

    // Handle youtu.be URLs
    if (urlObj.hostname === 'youtu.be') {
      const videoId = urlObj.pathname.substring(1);
      if (videoId) return videoId;
    }

    return null;
  } catch (error) {
    return null;
  }
}