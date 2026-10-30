import { randomUUID } from "node:crypto";
import { putNeonImage, verifyNeonStorageObject, deleteOwnedNeonImage } from "../lib/neon/imageStorage.mjs";

if (process.env.NEON_STORAGE_SMOKE_ON_BUILD !== "1") {
  console.log("Neon object storage smoke test skipped outside the isolated preview.");
} else {
  // Deterministic tiny PNG, not a user photo; remove immediately afterward.
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9D9fMAAAAASUVORK5CYII=",
    "base64",
  );
  const key = "site-images/smoke/" + Date.now() + "-" + randomUUID() + ".png";
  let url = "";
  try {
    url = await putNeonImage(key, bytes, "image/png");
    if (!await verifyNeonStorageObject(key, bytes)) throw new Error("Object contents did not match");
    const publicRead = await fetch(url, { signal: AbortSignal.timeout(12000) });
    const actual = Buffer.from(await publicRead.arrayBuffer());
    if (!publicRead.ok || !actual.equals(bytes)) throw new Error("Public object read did not match");
    console.log("Neon Storage Frankfurt: upload, verified read, public download successful");
  } finally {
    if (url) {
      await deleteOwnedNeonImage(url);
      console.log("Neon Storage Frankfurt: smoke test image removed");
    }
  }
}
