export function mapContentItems(items) {
  return items.reduce((map, item) => ({ ...map, [item.content_key]: item }), {});
}

export function getContentValue(content, key) {
  return content[key]?.value || "";
}

export async function compressAdminImage(file) {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1800 / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d", { alpha: true }).drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
  return blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), { type: "image/webp" }) : file;
}

export async function adminFetch(path, secret, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(path, {
      ...options,
      cache: "no-store",
      signal: options.signal || controller.signal,
      headers: { "x-admin-secret": secret, ...(options.headers || {}) },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("انتهت مهلة الاتصال. أعد المحاولة.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function uploadAdminImage({ file, item, previousPath, secret, onProgress }) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("content_key", item.key);
    form.append("title", item.title);
    if (previousPath) form.append("previous_path", previousPath);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/upload");
    xhr.timeout = 60_000;
    xhr.setRequestHeader("x-admin-secret", secret);
    xhr.upload.onprogress = (event) => event.lengthComputable && onProgress(Math.round((event.loaded / event.total) * 100));
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error(data.error || "Upload failed"));
      } catch (error) { reject(error); }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    xhr.ontimeout = () => reject(new Error("انتهت مهلة رفع الصورة. أعد المحاولة."));
    xhr.send(form);
  });
}
