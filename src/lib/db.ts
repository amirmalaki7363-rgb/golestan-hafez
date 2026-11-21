import { existsSync } from "fs";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Resolve the SQLite database URL at RUNTIME instead of relying on a value
 * baked in at build time.
 *
 * Why: Next.js copies the project .env into the standalone build output, and
 * that file holds an absolute path from the build machine (e.g.
 * /home/z/my-project/db/custom.db). On any other machine — like the deploy
 * target — that path does not exist, so every query crashed and the
 * deployment health check failed. This resolver prefers the first candidate
 * path that actually exists on disk:
 *
 *   1. DATABASE_URL from the environment (set by start.sh / .env)
 *   2. DATA_DIR/custom.db   (writable per-instance storage on the deploy)
 *   3. ./db/custom.db       (packaged seed snapshot)
 *   4. ./data/custom.db     (writable default next to the server)
 *
 * The last resort creates the DB through Prisma on first use.
 */
function resolveDatabaseUrl(): string {
  const candidates = [
    process.env.DATABASE_URL?.trim().replace(/^file:/, ""),
    process.env.DATA_DIR?.trim()
      ? `${process.env.DATA_DIR.trim().replace(/\/$/, "")}/custom.db`
      : undefined,
    `${process.cwd()}/db/custom.db`,
    `${process.cwd()}/data/custom.db`,
  ].filter((value): value is string => Boolean(value && value.length > 0));

  for (const candidate of candidates) {
    if (existsSync(candidate)) return `file:${candidate}`;
  }
  // Nothing exists yet — let Prisma create the first candidate.
  return `file:${candidates[0]}`;
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    // «query» logging made dev.log enormous and added per-request I/O
    // overhead; warn/error are enough for diagnostics.
    log: ["error", "warn"],
    datasources: { db: { url: resolveDatabaseUrl() } },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
