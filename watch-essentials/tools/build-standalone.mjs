// Inlines CSS, JS and fonts into one self-contained HTML file:
//   node tools/build-standalone.mjs  →  dist/watch-essentials.html
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
let html = await readFile(join(root, "index.html"), "utf8");
let css = await readFile(join(root, "styles.css"), "utf8");

const fontRefs = [...css.matchAll(/url\("(fonts\/[^"]+\.woff2)"\)/g)].map((m) => m[1]);
for (const ref of new Set(fontRefs)) {
  const b64 = (await readFile(join(root, ref))).toString("base64");
  css = css.split(`url("${ref}")`).join(`url("data:font/woff2;base64,${b64}")`);
}
html = html.replace('<link rel="stylesheet" href="styles.css" />', () => `<style>\n${css}\n</style>`);
for (const src of ["motion.js", "content.js", "watch.js", "app.js"]) {
  const js = (await readFile(join(root, src), "utf8")).replace(/<\/script/gi, "<\\/script");
  html = html.replace(`<script src="${src}"></script>`, () => `<script>\n${js}\n</script>`);
}
if (/(href|src)="(?!data:|#)[^"]+\.(css|js|woff2)"/.test(html)) throw new Error("unresolved external reference");
await mkdir(join(root, "dist"), { recursive: true });
const out = join(root, "dist", "watch-essentials.html");
await writeFile(out, html);
console.log(`→ ${out} (${(html.length / 1024).toFixed(0)} KB)`);
