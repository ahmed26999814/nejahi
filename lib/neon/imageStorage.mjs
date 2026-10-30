import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";

const BUCKET = "site-images";
const OBJECT_KEY_PATTERN = /^site-images\/[a-z_]+\/[0-9]+-[0-9a-f-]+\.(?:jpg|png|webp)$/i;

let client;

function storageConfig() {
  const endpoint = String(process.env.NEON_STORAGE_ENDPOINT || "").replace(/\/$/, "");
  const region = String(process.env.NEON_STORAGE_REGION || "");
  const bucket = String(process.env.NEON_STORAGE_BUCKET || "");
  const accessKeyId = process.env.NEON_STORAGE_ACCESS_KEY_ID;
  const secretAccessKey = process.env.NEON_STORAGE_SECRET_ACCESS_KEY;
  const url = new URL(endpoint);
  if (url.protocol !== "https:" || !url.hostname.endsWith(".aws.neon.tech")
      || !url.hostname.includes(".storage.") || !url.hostname.includes(".eu-central-1.")
      || bucket !== BUCKET || region !== "eu-central-1"
      || !accessKeyId || !secretAccessKey) {
    throw new Error("Neon object storage is not safely configured");
  }
  return { endpoint, region, bucket, accessKeyId, secretAccessKey };
}
function s3() {
  if (client) return client;
  const c = storageConfig();
  client = new S3Client({
    endpoint: c.endpoint,
    region: c.region,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    credentials: { accessKeyId: c.accessKeyId, secretAccessKey: c.secretAccessKey },
  });
  return client;
}
export function neonImagePublicUrl(key) {
  if (!OBJECT_KEY_PATTERN.test(key)) throw new Error("Invalid image key");
  const c = storageConfig();
  const segments = key.split("/").map(encodeURIComponent).join("/");
  return c.endpoint + "/" + c.bucket + "/" + segments;
}
export function ownedNeonImageKey(value) {
  try {
    const url = new URL(String(value || ""));
    const c = storageConfig();
    if (url.origin !== c.endpoint || url.search || url.hash) return null;
    const prefix = "/" + c.bucket + "/";
    if (!url.pathname.startsWith(prefix)) return null;
    const key = url.pathname.slice(prefix.length).split("/").map(decodeURIComponent).join("/");
    return OBJECT_KEY_PATTERN.test(key) ? key : null;
  } catch { return null; }
}
export async function putNeonImage(key, bytes, contentType) {
  if (!OBJECT_KEY_PATTERN.test(key)) throw new Error("Invalid image key");
  if (!["image/jpeg","image/png","image/webp"].includes(contentType)) throw new Error("Invalid image media type");
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > 3_500_000) {
    throw new Error("Invalid image size");
  }
  await s3().send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: bytes, ContentType: contentType,
    CacheControl: "public,max-age=31536000,immutable",
  }));
  return neonImagePublicUrl(key);
}
export async function deleteOwnedNeonImage(url) {
  const key = ownedNeonImageKey(url);
  if (!key) return false;
  await s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
  return true;
}
export async function verifyNeonStorageObject(key, expectedBytes) {
  const response = await s3().send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const buffer = Buffer.from(await response.Body.transformToByteArray());
  return buffer.equals(expectedBytes);
}
