export function contentValue(content, key, fallback = "") {
  return content?.[key]?.value || fallback;
}

export function imageAsset(content, key) {
  return content?.[key] || null;
}
