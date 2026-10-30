import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { putNeonImage, verifyNeonStorageObject } from "../lib/neon/imageStorage.mjs";

if (process.env.NEON_STORAGE_SEED_LOGO_ON_BUILD !== "1") {
  console.log("Neon brand logo seeding skipped outside the isolated preview.");
} else {
  const bytes = await readFile(new URL("../public/logo.png", import.meta.url));
  if (bytes.length < 100 || bytes.length > 3_500_000) {
    throw new Error("Unexpected brand logo size");
  }
  const digest = createHash("sha256").update(bytes).digest("hex").slice(0, 32);
  const key = "site-images/logo/1793380000000-" + digest + ".png";
  const url = await putNeonImage(key, bytes, "image/png");
  if (!await verifyNeonStorageObject(key, bytes)) throw new Error("Stored brand logo checksum mismatch");
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const publicBytes = Buffer.from(await response.arrayBuffer());
  if (!response.ok || !publicBytes.equals(bytes)) throw new Error("Stored logo public download failed");
  console.log("Neon Storage Frankfurt: MauriResults brand logo uploaded, verified, retained.");
}
