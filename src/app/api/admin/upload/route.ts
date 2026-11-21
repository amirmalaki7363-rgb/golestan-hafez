import { handleUploadPost } from "@/lib/upload-server";

/** POST /api/admin/upload — canonical image upload endpoint (admin only). */
export async function POST(req: Request) {
  return handleUploadPost(req);
}
