import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const manifest = JSON.parse(await readFile(new URL("../docs/neon-public-assets-manifest.json", import.meta.url), "utf8"));
const files = manifest.files || [];
if (files.length !== 25) throw new Error("Unexpected public storage inventory");
const hosts = [manifest.source_project, manifest.backup_host].map(ref => "https://" + ref + ".supabase.co");
let copied = 0, total = 0;

for (const entry of files) {
  const { bucket, name, bytes } = entry;
  if (!["site-images","app-releases"].includes(bucket)
      || !/^[A-Za-z0-9_./-]+$/.test(name)
      || name.includes("..") || !Number.isSafeInteger(Number(bytes))
      || Number(bytes) < 1 || Number(bytes) > 40_000_000) {
    throw new Error("Refusing unsafe storage asset manifest entry");
  }
  const key = [bucket, ...name.split("/")].map(encodeURIComponent).join("/");
  let data = null;
  for (const host of hosts) {
    try {
      const response = await fetch(host + "/storage/v1/object/public/" + key, {
        redirect: "follow",
        signal: AbortSignal.timeout(180000),
      });
      if (!response.ok) { console.log("Public asset HTTP " + response.status + " from " + new URL(host).hostname); continue; }
      const buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length !== Number(bytes)) { console.log("Public asset byte mismatch from " + new URL(host).hostname + ": expected " + bytes + ", received " + buffer.length); continue; }
      data = buffer;
      break;
    } catch (error) { console.log("Public asset fetch exception: " + (error?.name || "unknown")); }
  }
  if (!data) throw new Error("Unable to fetch matching public file: " + bucket + "/" + name);
  const destination = path.join("public", "neon-migrated-storage", bucket, name);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, data, { flag: "w" });
  copied++;
  total += data.byteLength;
  console.log("Mirrored " + copied + "/" + files.length + " public files (" + data.byteLength + " bytes)");
}
console.log("Verified all " + copied + " public storage objects; bytes=" + total);
