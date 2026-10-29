const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export function asciiCandidateDigits(value) {
  return String(value ?? "")
    .replace(/[٠-٩]/g, (digit) => String(ARABIC_DIGITS.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(PERSIAN_DIGITS.indexOf(digit)));
}

// Validate the whole value before normalizing; never search a truncated number.
export function normalizeCandidateNumber(value) {
  const digits = asciiCandidateDigits(value).trim();
  return /^\d{1,20}$/.test(digits) ? digits.replace(/^0+(?=\d)/, "") : "";
}
