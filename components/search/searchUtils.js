export function parseAverageValue(value) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function sanitizeCandidateNumber(value, maxLength = 20) {
  const normalized = String(value || "")
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)))
    .replace(/\D/g, "");

  return normalized.slice(0, maxLength);
}

export function getSearchInputMode() {
  return "numeric";
}
