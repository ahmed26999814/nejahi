import { createHash, timingSafeEqual } from "node:crypto";

// Hash to equal-length buffers before comparing. Fail closed when unconfigured.
export function isAuthorizedAdmin(request, secret = process.env.ADMIN_SECRET) {
  const provided = request.headers.get("x-admin-secret");
  if (!secret || !provided || provided.length > 4096) return false;
  const digest = (value) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(provided), digest(secret));
}
