import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const TEMP_DIR = path.join(process.cwd(), 'temp');

// Ensure temp directory exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR);
}

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }
  return new OpenAI({ apiKey });
};

async function downloadAudio(videoUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(TEMP_DIR, `audio-${Date.now()}.mp3`);

    // Enhanced yt-dlp parameters to bypass restrictions
    const ytDlp = spawn('yt-dlp', [
      '--no-check-certificate',
      '--no-cache-dir',
      '--extractor-retries', '3',
      '--force-ipv4',
      '--geo-bypass',
      '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--format', 'bestaudio[ext=m4a]/bestaudio',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--no-part',
      '--no-mtime',
      '--output', outputPath,
      videoUrl
    ]);

    ytDlp.stderr.on('data', (data) => {
      console.log(`yt-dlp stderr: ${data}`);
    });

    ytDlp.stdout.on('data', (data) => {
      console.log(`yt-dlp stdout: ${data}`);
    });

    ytDlp.on('close', (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`yt-dlp process exited with code ${code}`));
      }
    });

    ytDlp.on('error', (err) => {
      reject(err);
    });
  });
}

export async function generateTranscript(videoUrl: string): Promise<string> {
  try {
    console.log("Downloading audio from video...");
    const audioPath = await downloadAudio(videoUrl);
    console.log("Audio downloaded successfully");

    const openai = getOpenAIClient();

    console.log("Transcribing audio with Whisper...");
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      language: "en"
    });

    // Clean up the audio file
    fs.unlinkSync(audioPath);

    if (!transcription.text) {
      throw new Error("No transcription generated");
    }

    return transcription.text;
  } catch (error: any) {
    console.error("Transcription error:", error);
    throw new Error(`Failed to generate transcript: ${error.message}`);
  }
}