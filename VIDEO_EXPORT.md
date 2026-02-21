# Video Export Instructions

## Prerequisites

1. **FFmpeg** - Required for video encoding. Install from:
   - Windows: Download from https://ffmpeg.org/download.html and add to PATH
   - Or use: `choco install ffmpeg` (if you have Chocolatey)

2. **Node.js** - Already required for the project

## Setup

1. Install dependencies:

```bash
npm install
```

This will install:

- `puppeteer` - For browser automation and screenshot capture
- `fs-extra` - For file operations

## Export Video

Make sure the dev server is running on http://localhost:5173:

```bash
npm run dev
```

In a new terminal, run:

```bash
npm run export-video
```

This will:

1. 📸 Open a headless browser and capture 300 frames (10 seconds at 30 FPS)
2. 🎥 Encode frames into an MP4 video using FFmpeg
3. 📤 Save as `word-animation.mp4` in your project root

## Instagram Upload

The video will be 405x720px (perfect for Instagram Reels):

- Upload to Instagram Reels
- Add captions, music, and effects as needed
- Share!

## Troubleshooting

- **FFmpeg not found**: Make sure FFmpeg is installed and in your PATH
- **Puppeteer issues**: Delete `node_modules` and run `npm install` again
- **Port already in use**: Change port in `package.json` dev script
