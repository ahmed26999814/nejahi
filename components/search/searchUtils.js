export function parseAverageValue(value) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

export function getSearchInputMode(query) {
  return /^\d*$/.test(String(query || "")) ? "numeric" : "text";
}
