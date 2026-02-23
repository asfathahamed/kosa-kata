import puppeteer from "puppeteer";
import fs from "fs-extra";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjusted paths to point to the project root (one level up from scripts/)
const OUTPUT_DIR = path.join(__dirname, "../video-frames");
const VIDEO_OUTPUT_DIR = path.join(__dirname, "../output-video");
let VIDEO_OUTPUT = null; // will be set dynamically using the root word and timestamp
const DURATION = 10; // seconds
const FPS = 30;
const TOTAL_FRAMES = DURATION * FPS;

async function captureFrames() {
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
    const rawRoot = await page.$eval(
      "#root-word",
      (el) => el.textContent || "",
    );
    const root = (rawRoot || "word-animation").trim();
    // sanitize filename: allow alphanumerics, dash and underscore
    const safeRoot = root.replace(/[^a-zA-Z0-9-_]/g, "_");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    VIDEO_OUTPUT = path.join(VIDEO_OUTPUT_DIR, `${timestamp}-${safeRoot}.mp4`);
  } catch (err) {
    // fallback
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    VIDEO_OUTPUT = path.join(
      VIDEO_OUTPUT_DIR,
      `${timestamp}-word-animation.mp4`,
    );
  }

  // Ensure a guaranteed cover frame (initial static frame) is saved as the first frame
  console.log(`📸 Capturing ${TOTAL_FRAMES} frames...`);
  const firstFramePath = path.join(OUTPUT_DIR, `frame-00000.png`);
  try {
    // Give the page a single tick to apply styles/classes, then capture the cover
    await page.waitForTimeout(100);
    await page.screenshot({ path: firstFramePath, omitBackground: false });
  } catch (err) {
    console.warn("⚠️ Could not capture cover frame:", err.message);
  }

  // Capture frames
  for (let i = 0; i < TOTAL_FRAMES; i++) {
    const frameNumber = String(i).padStart(5, "0");
    const framePath = path.join(OUTPUT_DIR, `frame-${frameNumber}.png`);

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

async function createVideo() {
  console.log("🎥 Creating video from frames...");

  return new Promise((resolve, reject) => {
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

    ffmpeg.stdout.on("data", (data) => {
      process.stdout.write(`${data}`);
    });

    ffmpeg.stderr.on("data", (data) => {
      process.stderr.write(`${data}`);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0) {
        console.log(`\n✓ Video created successfully: ${VIDEO_OUTPUT}`);
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });
  });
}

async function cleanup() {
  console.log("🧹 Cleaning up frames...");
  fs.removeSync(OUTPUT_DIR);
  console.log("✓ Cleanup complete!");
}

async function main() {
  try {
    await captureFrames();
    await createVideo();
    await cleanup();
    console.log("\n✅ Video export complete! Ready to upload to Instagram.");
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

main();
