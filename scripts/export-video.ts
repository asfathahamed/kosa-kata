import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename: string = fileURLToPath(import.meta.url);
const __dirname: string = path.dirname(__filename);

// Adjusted paths to point to the project root (one level up from scripts/)
const OUTPUT_DIR: string = path.join(__dirname, "../video-frames");
const VIDEO_OUTPUT_DIR: string = path.join(__dirname, "../output-video");
let VIDEO_OUTPUT: string | null = null; // will be set dynamically using the root word and timestamp
const DURATION: number = 10; // seconds
const FPS: number = 30;
const TOTAL_FRAMES: number = DURATION * FPS;

async function captureFrames(): Promise<void> {
  console.log("🎬 Starting video capture...");

  // Clean up old frames
  if (fs.existsSync(OUTPUT_DIR)) {
    fs.removeSync(OUTPUT_DIR);
  }
  fs.ensureDirSync(OUTPUT_DIR);

  // Ensure output video directory exists
  fs.ensureDirSync(VIDEO_OUTPUT_DIR);

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  // Set viewport to Instagram Reel specs (405x720)
  await page.setViewport({
    width: 405,
    height: 720,
    deviceScaleFactor: 2, // For better quality
  });

  // Navigate to local server
  await page.goto("http://localhost:5173", { waitUntil: "networkidle2" });

  // Read the root word from the page and build an output filename
  try {
    const rawRoot: string = await page.$eval(
      "#root-word",
      (el: Element) => el.textContent || "",
    );
    const root: string = (rawRoot || "word-animation").trim();
    // sanitize filename: allow alphanumerics, dash and underscore
    const safeRoot: string = root.replace(/[^a-zA-Z0-9-_]/g, "_");
    const timestamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    VIDEO_OUTPUT = path.join(VIDEO_OUTPUT_DIR, `${timestamp}-${safeRoot}.mp4`);
  } catch (err) {
    // fallback
    const timestamp: string = new Date().toISOString().replace(/[:.]/g, "-");
    VIDEO_OUTPUT = path.join(
      VIDEO_OUTPUT_DIR,
      `${timestamp}-word-animation.mp4`,
    );
  }

  // Ensure a guaranteed cover frame (initial static frame) is saved as the first frame
  console.log(`📸 Capturing ${TOTAL_FRAMES} frames...`);
  const firstFramePath: string = path.join(OUTPUT_DIR, `frame-00000.png`);
  try {
    // Give the page a single tick to apply styles/classes, then capture the cover
    await page.waitForTimeout(100);
    await page.screenshot({ path: firstFramePath, omitBackground: false });
  } catch (err: any) {
    console.warn("⚠️ Could not capture cover frame:", err.message);
  }

  // Capture frames
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const frameNumber: string = String(i).padStart(5, "0");
    const framePath: string = path.join(OUTPUT_DIR, `frame-${frameNumber}.png`);

    await page.screenshot({
      path: framePath,
      omitBackground: false,
    });

    // Progress indicator
    if ((i + 1) % 30 === 0) {
      console.log(`  ✓ Frame ${i + 1}/${TOTAL_FRAMES}`);
    }

    // Wait for next frame (1/FPS seconds)
    await page.waitForTimeout(1000 / FPS);
  }

  await browser.close();
  console.log("✓ Frame capture complete!");
}

async function createVideo(): Promise<void> {
  console.log("🎥 Creating video from frames...");

  return new Promise((resolve, reject) => {
    if (!VIDEO_OUTPUT) {
      return reject(new Error("VIDEO_OUTPUT path is not set."));
    }
    const ffmpeg = spawn("ffmpeg", [
      "-framerate",
      FPS.toString(),
      "-i",
      path.join(OUTPUT_DIR, "frame-%05d.png"),
      "-y", // Overwrite output file
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-preset",
      "slow", // Quality vs speed tradeoff
      "-crf",
      "18", // Quality (lower is better, 0-51)
      VIDEO_OUTPUT,
    ]);

    ffmpeg.stdout.on("data", (data: any) => {
      process.stdout.write(`${data}`);
    });

    ffmpeg.stderr.on("data", (data: any) => {
      process.stderr.write(`${data}`);
    });

    ffmpeg.on("close", (code: number | null) => {
      if (code === 0) {
        console.log(`\n✓ Video created successfully: ${VIDEO_OUTPUT}`);
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", (err: Error) => {
      reject(err);
    });
  });
}

async function cleanup(): Promise<void> {
  console.log("🧹 Cleaning up frames...");
  fs.removeSync(OUTPUT_DIR);
  console.log("✓ Cleanup complete!");
}

async function main(): Promise<void> {
  try {
    await captureFrames();
    await createVideo();
    await cleanup();
    console.log("\n✅ Video export complete! Ready to upload to Instagram.");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
