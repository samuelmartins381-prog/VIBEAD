// Builds preview/before-after.mp4 (1920×1080): the original app's reference
// screens on the left, the recorded prototype demo on the right.
//   node tools/compare.mjs      (run tools/record.mjs first)
import { mkdir, writeFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = createRequire("/opt/node-tools/node_modules/")("playwright"); }

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "preview");
const tmp = join(outDir, ".compare");
await rm(tmp, { recursive: true, force: true });
await mkdir(tmp, { recursive: true });

const after = join(outDir, "after-10s-demo.mp4");
const dur = +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", after]).toString().trim();

const PW = 416, PH = 900, TOP = 132;
const LX = 960 - 120 - PW, RX = 960 + 120;
const fonts = pathToFileURL(join(root, "fonts")).href;

// Frame overlay: background everywhere except two rounded phone windows.
const html = `<!doctype html><html><head><style>
@font-face{font-family:C;src:url(${fonts}/cormorant-garamond-latin-300-normal.woff2)}
@font-face{font-family:C;font-style:italic;src:url(${fonts}/cormorant-garamond-latin-400-italic.woff2)}
@font-face{font-family:M;font-weight:500;src:url(${fonts}/montserrat-latin-500-normal.woff2)}
html,body{margin:0;width:1920px;height:1080px;background:transparent}
.lab{position:absolute;top:48px;width:${PW}px;text-align:center;color:#efe8dc}
.k{font:500 13px M;letter-spacing:.34em;text-transform:uppercase;color:#d8c49b;margin-bottom:10px}
.k.b{color:#8d857b}
.t{font:300 30px C}
.t em{font:italic 400 30px C;color:#d8c49b}
.mid{position:absolute;left:940px;top:${TOP + PH / 2 - 40}px;width:40px;height:80px;border-left:1px solid rgba(216,196,155,.3);transform:translateX(20px)}
</style></head><body>
<svg width="1920" height="1080" style="position:absolute;inset:0"><defs><mask id="m"><rect width="1920" height="1080" fill="#fff"/>
<rect x="${LX}" y="${TOP}" width="${PW}" height="${PH}" rx="38" fill="#000"/><rect x="${RX}" y="${TOP}" width="${PW}" height="${PH}" rx="38" fill="#000"/></mask></defs>
<rect width="1920" height="1080" fill="#11100f" mask="url(#m)"/>
<rect x="${LX - 0.5}" y="${TOP - 0.5}" width="${PW + 1}" height="${PH + 1}" rx="38.5" fill="none" stroke="rgba(216,196,155,.22)"/>
<rect x="${RX - 0.5}" y="${TOP - 0.5}" width="${PW + 1}" height="${PH + 1}" rx="38.5" fill="none" stroke="rgba(216,196,155,.22)"/></svg>
<div class="lab" style="left:${LX}px"><div class="k b">Before</div><div class="t">Current app</div></div>
<div class="lab" style="left:${RX}px"><div class="k">After</div><div class="t">Interactive <em>redesign</em></div></div>
<div class="mid"></div>
</body></html>`;
await writeFile(join(tmp, "frame.html"), html);
const browser = await playwright.chromium.launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(join(tmp, "frame.html")).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(tmp, "frame.png"), omitBackground: true });
await browser.close();

// Before: the five reference screens, evenly spread over the demo's duration.
const before = ["1-intro", "2-speak-my-language", "3-video", "4-watch-components", "5-quiz-correct"].map((n) => join(root, "reference", "before", `${n}.png`));
const each = dur / before.length;
const list = before.flatMap((f) => [`file '${f}'`, `duration ${each.toFixed(3)}`]).concat(`file '${before.at(-1)}'`);
await writeFile(join(tmp, "before.txt"), list.join("\n"));

const out = join(outDir, "before-after.mp4");
execFileSync("ffmpeg", ["-v", "error", "-y",
  "-f", "lavfi", "-i", `color=c=0x11100f:s=1920x1080:r=30:d=${dur}`,
  "-f", "concat", "-safe", "0", "-i", join(tmp, "before.txt"),
  "-i", after,
  "-i", join(tmp, "frame.png"),
  "-filter_complex",
  `[1:v]scale=${PW}:${PH}:flags=lanczos,fps=30,setsar=1[b];` +
  `[2:v]scale=${PW}:${PH}:flags=lanczos,setsar=1[a];` +
  `[0:v][b]overlay=${LX}:${TOP}:shortest=1[t1];[t1][a]overlay=${RX}:${TOP}:shortest=1[t2];[t2][3:v]overlay=0:0,format=yuv420p[v]`,
  "-map", "[v]", "-t", String(dur), "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-movflags", "+faststart", out]);
await rm(tmp, { recursive: true, force: true });
console.log(`→ ${out} (${dur.toFixed(1)} s)`);
