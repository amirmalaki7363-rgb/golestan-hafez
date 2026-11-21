import { handleUploadPost } from "@/lib/upload-server";

/**
 * POST /api/admin/content/upload — fallback image upload endpoint (admin only).
 *
 * The admin client automatically retries here when the canonical
 * /api/admin/upload endpoint is unreachable, so image upload keeps
 * working even if one route file goes missing.
 */
export async function POST(req: Request) {
  return handleUploadPost(req);
}
