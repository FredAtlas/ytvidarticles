import fetch from "node-fetch";

export async function getTranscript(videoUrl: string): Promise<string> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  try {
    const response = await fetch(
      `https://youtube-transcript.p.rapidapi.com/retrieve?videoId=${videoId}`,
      {
        headers: {
          "X-RapidAPI-Key": process.env.RAPID_API_KEY || "",
          "X-RapidAPI-Host": "youtube-transcript.p.rapidapi.com",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch transcript");
    }

    const data = await response.json();
    return data.transcript
      .map((item: { text: string }) => item.text)
      .join(" ")
      .trim();
  } catch (error) {
    throw new Error(`Failed to get transcript: ${error.message}`);
  }
}

function extractVideoId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
