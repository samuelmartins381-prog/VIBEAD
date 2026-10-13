// Records the autoplay demonstration as a crisp 2× portrait video.
//   node tools/record.mjs [short|full]
// Frames come from the Chrome DevTools screencast (real timestamps), then
// ffmpeg assembles a constant-frame-rate MP4 plus a lightweight GIF in preview/.
import { mkdir, writeFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { serve } from "./serve.mjs";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = createRequire("/opt/node-tools/node_modules/")("playwright"); }

const mode = process.argv[2] === "full" ? "full" : "short";
const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "preview");
const frameDir = join(outDir, `.frames-${mode}`);
await rm(frameDir, { recursive: true, force: true });
await mkdir(frameDir, { recursive: true });

const PORT = 4322;
const server = await serve(PORT);
const browser = await playwright.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);

const frames = [];
const writes = [];
cdp.on("Page.screencastFrame", ({ data, sessionId, metadata }) => {
  const file = join(frameDir, `${String(frames.length).padStart(5, "0")}.jpg`);
  frames.push({ file, t: metadata.timestamp });
  writes.push(writeFile(file, Buffer.from(data, "base64")));
  cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
});

await page.goto(`http://localhost:${PORT}/?autoplay${mode === "full" ? "=full" : ""}`, { waitUntil: "commit" });
await cdp.send("Page.startScreencast", { format: "jpeg", quality: 94, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
await page.waitForFunction(() => document.documentElement.classList.contains("is-autoplay-done"), null, { timeout: 60000 });
await page.waitForTimeout(500);
await cdp.send("Page.stopScreencast");
await Promise.all(writes);
await browser.close();
server.close();

const list = frames;
const lines = [];
for (let i = 0; i < list.length; i++) {
  const dur = i < list.length - 1 ? Math.max(0.001, list[i + 1].t - list[i].t) : 0.5;
  lines.push(`file '${list[i].file}'`, `duration ${dur.toFixed(4)}`);
}
lines.push(`file '${list[list.length - 1].file}'`);
const concat = join(frameDir, "frames.txt");
await writeFile(concat, lines.join("\n"));

const mp4 = join(outDir, mode === "full" ? "after-full-chapter.mp4" : "after-10s-demo.mp4");
execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", concat,
  "-vf", "fps=30,scale=780:1688:flags=lanczos,format=yuv420p", "-c:v", "libx264", "-preset", "slow", "-crf", "17", "-movflags", "+faststart", mp4]);
if (mode === "short") {
  const gif = join(outDir, "after-10s-demo.gif");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-i", mp4, "-vf",
    "fps=15,scale=360:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=160:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle", gif]);
}
const dur = execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4]).toString().trim();
await rm(frameDir, { recursive: true, force: true });
console.log(`${frames.length} frames → ${mp4} (${(+dur).toFixed(1)} s)`);
