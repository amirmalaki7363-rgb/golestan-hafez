// One-off maintenance: recompress oversized UploadedImage blobs in place.
// The upload flow stores every image as a DB blob; blobs saved before the
// sharp-based compression era are huge (2.4MB…), which makes the storefront
// /_next/image optimizer fetch and decode megabytes on every cold request.
// Same id, same mime — only the bytes get smaller.
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

interface Row {
  id: string;
  mime: string;
  size: number;
  data: Uint8Array;
}

const rows: Row[] = await db.uploadedImage.findMany();
rows.sort((a, b) => b.size - a.size);

let before = 0;
let after = 0;
let changed = 0;

for (const row of rows) {
  before += row.size;
  if (row.size < 150 * 1024) {
    after += row.size;
    continue;
  }
  try {
    const buf = Buffer.from(row.data);
    const img = sharp(buf);
    const isPng = row.mime === "image/png";
    const isWebp = row.mime === "image/webp";
    let out: Buffer;
    if (isPng) {
      out = await img
        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
        .png({ palette: true, quality: 85, compressionLevel: 9 })
        .toBuffer();
    } else if (isWebp) {
      // webp blobs are small/optimized already — keep as-is
      after += row.size;
      continue;
    } else {
      out = await img
        .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 72, progressive: true, mozjpeg: true })
        .toBuffer();
    }
    if (out.length < row.size) {
      await db.uploadedImage.update({
        where: { id: row.id },
        data: { data: new Uint8Array(out), size: out.length },
      });
      after += out.length;
      changed++;
      console.log(
        `${row.id} (${row.mime}): ${(row.size / 1024).toFixed(0)}KB -> ${(out.length / 1024).toFixed(0)}KB`
      );
    } else {
      after += row.size;
      console.log(`${row.id}: kept (${row.mime}, recompress not smaller)`);
    }
  } catch (e) {
    after += row.size;
    console.error(`SKIP ${row.id}:`, e);
  }
}

console.log(
  `TOTAL: ${(before / 1024 / 1024).toFixed(1)}MB -> ${(after / 1024 / 1024).toFixed(1)}MB, ${changed} blobs recompressed`
);
await db.$disconnect();
