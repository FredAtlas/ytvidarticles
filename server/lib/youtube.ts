import YoutubeTranscript from 'youtube-transcript';

export async function getTranscript(url: string): Promise<string> {
  try {
    const videoId = new URL(url).searchParams.get('v');
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    return transcript.map(item => item.text).join(' ');
  } catch (error) {
    throw new Error("Failed to fetch transcript: " + (error as Error).message);
  }
}