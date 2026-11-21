/**
 * Boot-time guard: restores critical files that the sandbox environment
 * keeps wiping between restarts (observed 4 times with the upload routes).
 *
 * How it works: for every tracked file listed in CRITICAL_FILES, if the file
 * is MISSING from the working tree but EXISTS in HEAD, it is restored via
 * `git checkout HEAD -- <path>`. Modified files are left untouched.
 *
 * Wired into `bun run dev` so the server can never start with broken routes.
 */
import { existsSync } from "fs";
import path from "path";
import { execSync } from "child_process";

const CRITICAL_FILES: string[] = [
  // upload endpoints (repeatedly wiped by the environment)
  "src/app/api/admin/upload/route.ts",
  "src/app/api/admin/content/upload/route.ts",
  "src/app/api/admin/content/route.ts",
  // DB-backed image serving + shared upload logic
  "src/app/api/uploads/[id]/route.ts",
  "src/lib/upload-server.ts",
  "src/lib/upload-client.ts",
];

function fileTrackedInHead(rel: string): boolean {
  try {
    execSync(`git cat-file -e "HEAD:${rel}"`, { cwd: process.cwd(), stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

function restoreFromHead(rel: string): void {
  execSync(`git checkout HEAD -- "${rel}"`, { cwd: process.cwd(), stdio: "pipe" });
}

let healed = 0;
for (const rel of CRITICAL_FILES) {
  const abs = path.join(process.cwd(), rel);
  if (existsSync(abs)) continue;
  if (!fileTrackedInHead(rel)) {
    console.warn(`[ensure-critical-files] MISSING and not in HEAD: ${rel} — cannot restore`);
    continue;
  }
  try {
    restoreFromHead(rel);
    console.log(`[ensure-critical-files] restored missing file: ${rel}`);
    healed++;
  } catch (err) {
    console.error(`[ensure-critical-files] FAILED to restore ${rel}:`, err);
    process.exitCode = 1;
  }
}

if (healed === 0) {
  console.log("[ensure-critical-files] all critical files intact");
}
