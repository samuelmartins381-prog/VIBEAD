// Minimal static server for the prototype (no dependencies).
//   node tools/serve.mjs [port]
import http from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const types = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2", ".png": "image/png", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm", ".gif": "image/gif",
};

export function serve(port = 4173) {
  const server = http.createServer(async (req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, "http://x").pathname)).replace(/^(\.\.[/\\])+/, "");
    const file = join(root, path.endsWith("/") ? path + "index.html" : path);
    if (!file.startsWith(root)) return res.writeHead(403).end();
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": types[extname(file)] || "application/octet-stream", "cache-control": "no-store" });
      res.end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.argv[2]) || 4173;
  serve(port).then(() => console.log(`Watch Essentials → http://localhost:${port}/`));
}
