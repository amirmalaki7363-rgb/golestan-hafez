// Seeds the Golestane Hafez admin account.
// Run: bun scripts/seed-admin.mjs
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

const db = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const ADMIN_PHONE = "09127385527";
const ADMIN_PASSWORD = "golestane123";

try {
  const existing = await db.user.findUnique({ where: { phone: ADMIN_PHONE } });
  if (existing) {
    if (existing.role !== "ADMIN") {
      await db.user.update({ where: { id: existing.id }, data: { role: "ADMIN" } });
      console.log(`User ${ADMIN_PHONE} promoted to ADMIN.`);
    } else {
      console.log(`Admin ${ADMIN_PHONE} already exists — nothing to do.`);
    }
  } else {
    await db.user.create({
      data: {
        name: "مدیر گلستان حافظ",
        phone: ADMIN_PHONE,
        password: hashPassword(ADMIN_PASSWORD),
        role: "ADMIN",
      },
    });
    console.log(`Admin created: ${ADMIN_PHONE} / ${ADMIN_PASSWORD}`);
  }
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
