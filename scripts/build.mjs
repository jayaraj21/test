// Vercel build: copies the site into public/ and downloads the product photos
// from Wikimedia Commons so the live site serves them as its own files.
// If a photo can't be downloaded, the page links it from Commons instead,
// and if that fails too the card shows its drawing. The build never fails over photos.
import { mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "public");
const API = process.env.COMMONS_API || "https://commons.wikimedia.org/w/api.php";
const WIDTH = 900;
// Wikimedia asks automated clients to send a descriptive User-Agent.
const UA = "AyushDesignDrawer/1.0 (birthday site; https://github.com/jayaraj21/ayush-design-drawer)";

const html = await readFile(path.join(ROOT, "index.html"), "utf8");
const block = html.match(/\/\*PHOTOS\*\/([\s\S]*?)\/\*END-PHOTOS\*\//);
if (!block) throw new Error("PHOTOS block not found in index.html");
const PHOTOS = Function(`"use strict"; return (${block[1]});`)();

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, "photos"), { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function get(url, tries = 3) {
  for (let i = 1; ; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) return res;
      if (i >= tries || ![429, 500, 502, 503, 504].includes(res.status)) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (i >= tries) throw e;
    }
    await sleep(1000 * 2 ** i);
  }
}
const strip = (s = "") => s.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
const slug = (s) => s.toLowerCase().replace(/\.[a-z]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

// 1. Look up thumbnail URLs, authors and licences in batches.
const names = [...new Set(Object.values(PHOTOS).flat())];
const info = {};
for (let i = 0; i < names.length; i += 40) {
  const batch = names.slice(i, i + 40);
  const q = new URLSearchParams({
    action: "query", format: "json", formatversion: "2", prop: "imageinfo",
    iiprop: "url|extmetadata|mime", iiurlwidth: String(WIDTH),
    titles: batch.map((n) => "File:" + n).join("|")
  });
  try {
    const data = await (await get(`${API}?${q}`)).json();
    const norm = Object.fromEntries((data.query?.normalized || []).map((x) => [x.to, x.from]));
    for (const p of data.query?.pages || []) {
      const ii = p.imageinfo?.[0];
      const asked = (norm[p.title] || p.title).replace(/^File:/, "");
      if (!ii || p.missing) { console.warn(`  missing on Commons: ${asked}`); continue; }
      const md = ii.extmetadata || {};
      info[asked] = {
        url: ii.thumburl || ii.url,
        author: strip(md.Artist?.value).slice(0, 60),
        license: strip(md.LicenseShortName?.value)
      };
    }
  } catch (e) {
    console.warn(`  metadata lookup failed: ${e.message}`);
  }
}

// 2. Download each photo.
const local = {};
let ok = 0;
for (const [id, list] of Object.entries(PHOTOS)) {
  for (const name of list) {
    const meta = info[name];
    if (!meta) continue;
    try {
      const res = await get(meta.url);
      const type = res.headers.get("content-type") || "";
      const ext = type.includes("png") ? "png" : type.includes("gif") ? "gif" : type.includes("webp") ? "webp" : "jpg";
      const file = `photos/${id}-${slug(name)}.${ext}`;
      await writeFile(path.join(OUT, file), Buffer.from(await res.arrayBuffer()));
      local[name] = { src: file, author: meta.author, license: meta.license };
      ok++;
      console.log(`  ✓ ${file}`);
    } catch (e) {
      console.warn(`  ✗ ${name}: ${e.message}`);
    }
    await sleep(150);
  }
}
console.log(`Downloaded ${ok} of ${names.length} photos.`);

// 3. Write the page with the local photo map filled in.
const json = JSON.stringify(local).replace(/</g, "\\u003c");
const out = html.replace(/\/\*LOCAL-PHOTOS\*\/[\s\S]*?\/\*END-LOCAL-PHOTOS\*\//, `/*LOCAL-PHOTOS*/${json}/*END-LOCAL-PHOTOS*/`);
await writeFile(path.join(OUT, "index.html"), out);
await writeFile(path.join(OUT, "photos.json"), JSON.stringify(local, null, 2));
console.log("Built public/");
