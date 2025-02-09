import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const TEMP_DIR = path.join(process.cwd(), 'temp');
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 2000;

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

// List of user agents to rotate through
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0'
];

async function downloadAudio(videoUrl: string, retryCount = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    const outputPath = path.join(TEMP_DIR, `audio-${Date.now()}.mp3`);
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    // Enhanced yt-dlp parameters for better success rate
    const ytDlp = spawn('yt-dlp', [
      '--no-check-certificate',
      '--no-cache-dir',
      '--extractor-retries', '5',
      '--force-ipv4',
      '--geo-bypass',
      '--user-agent', userAgent,
      '--add-header', 'Accept-Language:en-US,en;q=0.9',
      '--add-header', 'Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      '--add-header', 'Accept-Encoding:gzip, deflate, br',
      '--add-header', 'DNT:1',
      '--add-header', 'Connection:keep-alive',
      '--format', 'bestaudio[ext=m4a]/bestaudio',
      '--extract-audio',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
      '--no-part',
      '--no-mtime',
      '--no-warnings',
      '--quiet',
      '--output', outputPath,
      videoUrl
    ]);

    let errorOutput = '';

    ytDlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log(`yt-dlp stderr: ${data}`);
    });

    ytDlp.stdout.on('data', (data) => {
      console.log(`yt-dlp stdout: ${data}`);
    });

    ytDlp.on('close', async (code) => {
      if (code === 0) {
        resolve(outputPath);
      } else {
        console.error(`yt-dlp failed with code ${code}:`, errorOutput);

        // Implement exponential backoff retry logic
        if (retryCount < MAX_RETRIES) {
          const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
          console.log(`Retrying download after ${retryDelay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);

          setTimeout(async () => {
            try {
              const result = await downloadAudio(videoUrl, retryCount + 1);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          }, retryDelay);
        } else {
          reject(new Error(`Failed to download video after ${MAX_RETRIES} attempts: ${errorOutput}`));
        }
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
    console.log("Audio downloaded successfully to:", audioPath);

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