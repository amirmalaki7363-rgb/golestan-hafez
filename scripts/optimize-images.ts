// One-off: recompress oversized source images in place (same path/format).
import sharp from "sharp";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["public/images", "public/uploads/custom-flowers", "public/images/logos"];
const MIN_BYTES = 150 * 1024;

interface Stat { before: number; after: number; file: string }
const stats: Stat[] = [];

async function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { await walk(p); continue; }
    if (statSync(p).size < MIN_BYTES) continue;
    if (!/\.(jpe?g|png)$/i.test(name)) continue;
    const before = statSync(p).size;
    const isPng = /\.png$/i.test(name);
    try {
      const img = sharp(p);
      const meta = await img.metadata();
      const resized = img.resize({
        width: isPng ? 1200 : 1600,
        height: isPng ? 1200 : 1600,
        fit: "inside",
        withoutEnlargement: true,
      });
      const buf = isPng
        ? await resized.png({ palette: true, quality: 85, compressionLevel: 9 }).toBuffer()
        : await resized.jpeg({ quality: 72, progressive: true, mozjpeg: true }).toBuffer();
      if (buf.length < before) {
        await Bun.write(p, buf);
        stats.push({ file: p, before, after: buf.length });
      }
    } catch (e) {
      console.error("SKIP", p, e);
    }
  }
}

for (const r of ROOTS) await walk(r);
let b = 0, a = 0;
for (const s of stats) { b += s.before; a += s.after; }
for (const s of stats.sort((x, y) => (y.before - y.after) - (x.before - x.after)))
  console.log(`${s.file}: ${(s.before/1024).toFixed(0)}K -> ${(s.after/1024).toFixed(0)}K`);
console.log(`TOTAL: ${(b/1024/1024).toFixed(1)}MB -> ${(a/1024/1024).toFixed(1)}MB`);
