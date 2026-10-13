// End-to-end QA for the Watch Essentials prototype.
//   node tools/qa.mjs            (needs Playwright; see README)
// Checks every primary interaction at three phone sizes and on desktop,
// verifies that tapping each real part of the watch selects the right
// component, collects console errors, and saves screenshots to preview/.
import { mkdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "./serve.mjs";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); } catch { playwright = createRequire("/opt/node-tools/node_modules/")("playwright"); }
const { chromium } = playwright;

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, "..", "preview");
await mkdir(outDir, { recursive: true });

const PORT = 4321;
const server = await serve(PORT);
const browser = await chromium.launch();
const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
};

// Points on each physical part, in watch units (centre 220,270).
const P = (r, deg) => [220 + r * Math.sin((deg * Math.PI) / 180), 270 - r * Math.cos((deg * Math.PI) / 180)];
const PROBES = {
  crystal: [[220, 270], P(60, 300), P(90, 135)],
  bezel: [P(108, 0), P(108, 200), P(108, 60)],
  case: [P(119, 225), P(119, 315), P(119, 160)],
  crown: [[358, 270], [362, 255]],
  lugs: [[142, 140], [298, 140], [142, 400], [298, 400]],
};

async function run(vp) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: vp.dsf ?? 2,
    hasTouch: !!vp.mobile,
    isMobile: !!vp.mobile,
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  const tag = `${vp.name}`;
  const shot = (n) => page.screenshot({ path: join(outDir, `${tag}-${n}.png`) });
  const tapAt = async (x, y) => (vp.mobile ? page.touchscreen.tap(x, y) : page.mouse.click(x, y));
  const tapSel = async (sel) => {
    const b = await page.locator(sel).boundingBox();
    if (!b) throw new Error("no box for " + sel);
    await tapAt(b.x + b.width / 2, b.y + b.height / 2);
  };
  const inView = async (sel) => {
    const b = await page.locator(sel).boundingBox();
    return b && b.y >= 0 && b.y + b.height <= vp.h + 0.5 && b.x >= 0 && b.x + b.width <= vp.w + 0.5;
  };
  const noOverflow = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth && document.body.scrollWidth <= window.innerWidth);

  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForTimeout(1900);
  await shot("1-intro");
  check(`${tag}: intro has no horizontal overflow`, await noOverflow());
  check(`${tag}: Begin button fully visible`, await inView("#begin"));

  await tapSel("#begin");
  await page.waitForTimeout(450);
  if (vp.name === "390x844") await shot("2-aperture");
  await page.waitForTimeout(1900);
  check(`${tag}: Begin → explore scene`, await page.evaluate(() => WE.state.scene === "explore"));
  await shot("3-explore");
  check(`${tag}: explore CTA + rail visible`, (await inView("#toQuiz")) && (await inView("#rail")));
  check(`${tag}: explore has no horizontal overflow`, await noOverflow());

  // Geometric hit-testing: every probe on every part resolves to that part.
  const hits = await page.evaluate((PROBES) => {
    const svg = document.getElementById("watch");
    const m = svg.getScreenCTM();
    const out = [];
    for (const [id, pts] of Object.entries(PROBES)) {
      for (const [x, y] of pts) {
        const p = new DOMPoint(x, y).matrixTransform(m);
        const el = document.elementFromPoint(p.x, p.y);
        out.push({ id, got: el && el.dataset ? el.dataset.id : null, x: Math.round(p.x), y: Math.round(p.y) });
      }
    }
    return out;
  }, PROBES);
  const bad = hits.filter((h) => h.got !== h.id);
  check(`${tag}: ${hits.length} tap probes land on the correct component`, bad.length === 0, bad.map((b) => `${b.id}→${b.got}`).join(", "));

  // Real taps on the watch for each component.
  for (const id of ["bezel", "crown", "crystal", "case", "lugs"]) {
    const pt = await page.evaluate((id) => { const p = WE.watch.screenPoint(id); return { x: p.x, y: p.y }; }, id);
    await tapAt(pt.x, pt.y);
    await page.waitForTimeout(id === "crown" ? 1900 : 1300);
    const st = await page.evaluate(() => ({ sel: WE.state.selected, name: document.getElementById("exName").textContent, callouts: document.querySelectorAll(".w-callout").length }));
    check(`${tag}: tap ${id} selects it, updates copy and draws one call-out`, st.sel === id && st.name.toLowerCase() === id && st.callouts === 1, JSON.stringify(st));
    if (vp.name === "390x844") await shot(`4-explore-${id}`);
  }
  // Rail selection
  await tapSel('.rail-tab[data-id="bezel"]');
  await page.waitForTimeout(700);
  check(`${tag}: rail tab selects component`, await page.evaluate(() => WE.state.selected === "bezel"));

  // Knowledge check
  await tapSel("#toQuiz");
  await page.waitForTimeout(1500);
  check(`${tag}: CTA → knowledge check`, await page.evaluate(() => WE.state.scene === "quiz"));
  check(`${tag}: Next hidden before answering`, await page.evaluate(() => getComputedStyle(document.getElementById("qNext")).display === "none"));
  check(`${tag}: all answers visible`, (await inView('.opt[data-id="case"]')) && (await inView('.opt[data-id="bezel"]')));
  await shot("5-quiz");

  await tapSel('.opt[data-id="crystal"]');
  await page.waitForTimeout(700);
  const wrong = await page.evaluate(() => ({ answered: WE.state.answered, hint: document.getElementById("qHint").textContent, cls: document.querySelector('.opt[data-id="crystal"]').className }));
  check(`${tag}: wrong answer → gentle hint, retry allowed`, !wrong.answered && wrong.hint.length > 10 && wrong.cls.includes("is-wrong"));
  check(`${tag}: hint fully visible`, await inView("#qHint"));
  await shot("6-quiz-wrong");

  await tapSel('.opt[data-id="bezel"]');
  await page.waitForTimeout(1600);
  const right = await page.evaluate(() => ({
    answered: WE.state.answered,
    result: getComputedStyle(document.getElementById("qResult")).opacity,
    faded: getComputedStyle(document.querySelector('.opt[data-id="case"]')).opacity,
    next: getComputedStyle(document.getElementById("qNext")).display,
  }));
  check(`${tag}: correct answer → confirmation, explanation, Next`, right.answered && +right.result > 0.95 && +right.faded < 0.05 && right.next !== "none", JSON.stringify(right));
  check(`${tag}: Next button fully visible`, await inView("#qNext"));
  await shot("7-quiz-correct");

  await tapSel("#qNext");
  await page.waitForTimeout(1100);
  await tapSel('.opt[data-id="crown"]');
  await page.waitForTimeout(1500);
  if (vp.name === "390x844") await shot("8-quiz-q2-crown");
  await tapSel("#qNext");
  await page.waitForTimeout(1100);
  await tapSel('.opt[data-id="case"]');
  await page.waitForTimeout(600);
  check(`${tag}: previous explanation hidden on the next question`, await page.evaluate(() => getComputedStyle(document.getElementById("qResult")).visibility === "hidden"));
  if (vp.name === "390x844") await shot("9-quiz-q3-case-hint");
  await tapSel('.opt[data-id="lugs"]');
  await page.waitForTimeout(1500);
  await tapSel("#qNext");
  await page.waitForTimeout(2000);
  const done = await page.evaluate(() => ({ scene: WE.state.scene, earned: document.querySelectorAll("#doneEarned li").length, first: WE.state.firstTry }));
  check(`${tag}: chapter completes with 3 components earned`, done.scene === "done" && done.earned === 3, JSON.stringify(done));
  check(`${tag}: completion actions visible`, (await inView("#retake")) && (await inView("#exploreAgain")));
  await shot("10-done");

  await tapSel("#retake");
  await page.waitForTimeout(1500);
  const retake = await page.evaluate(() => ({ scene: WE.state.scene, q: WE.state.q, opts: [...document.querySelectorAll(".opt")].map((o) => getComputedStyle(o).opacity), meta: getComputedStyle(document.querySelector(".q-body")).opacity }));
  check(`${tag}: Retake restarts the check, all visible`, retake.scene === "quiz" && retake.q === 0 && retake.opts.every((o) => +o > 0.95) && +retake.meta > 0.95, JSON.stringify(retake));
  await tapSel("#back");
  await page.waitForTimeout(1200);
  check(`${tag}: Back from check → explore`, await page.evaluate(() => WE.state.scene === "explore" && getComputedStyle(document.getElementById("toQuiz")).opacity > 0.95));
  await tapSel("#back");
  await page.waitForTimeout(1600);
  check(`${tag}: Back from explore → intro`, await page.evaluate(() => WE.state.scene === "intro" && document.getElementById("intro").classList.contains("is-active")));
  await tapSel("#begin");
  await page.waitForTimeout(2200);
  check(`${tag}: intro → explore again after Back`, await page.evaluate(() => WE.state.scene === "explore" && document.getElementById("learn").classList.contains("is-active")));

  check(`${tag}: no console errors`, errors.length === 0, errors.join(" | "));
  await ctx.close();
}

async function reducedMotion() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForTimeout(500);
  await page.click("#begin");
  await page.waitForTimeout(500);
  await page.evaluate(() => WE.select("crown"));
  await page.waitForTimeout(300);
  await page.click("#toQuiz");
  await page.waitForTimeout(300);
  await page.click('.opt[data-id="bezel"]');
  await page.waitForTimeout(300);
  const ok = await page.evaluate(() => WE.state.answered === true);
  check("reduced-motion: full flow works with motion collapsed", ok && errors.length === 0, errors.join(" | "));
  await ctx.close();
}

async function autoplay() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/?autoplay`);
  await page.waitForFunction(() => document.documentElement.classList.contains("is-autoplay-done"), null, { timeout: 20000 });
  const st = await page.evaluate(() => ({ scene: WE.state.scene, answered: WE.state.answered, visited: [...WE.state.visited] }));
  check("autoplay: scripted demo reaches a correct answer", st.scene === "quiz" && st.answered && st.visited.includes("bezel") && st.visited.includes("crown"), JSON.stringify(st));
  await ctx.close();
}

const viewports = [
  { name: "390x844", w: 390, h: 844, mobile: true },
  { name: "375x812", w: 375, h: 812, mobile: true },
  { name: "430x932", w: 430, h: 932, mobile: true },
  { name: "desktop", w: 1440, h: 900, dsf: 1 },
];
for (const vp of viewports) await run(vp);
await reducedMotion();
await autoplay();

await browser.close();
server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
