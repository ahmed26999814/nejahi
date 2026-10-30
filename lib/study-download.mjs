import studyIndex from "../data/indexed-drive-study-files.json" with { type: "json" };
import ownedPartA from "../data/study-owned-drive-part-a.json" with { type: "json" };
import ownedPartB from "../data/study-owned-drive-part-b.json" with { type: "json" };

const FILES_BY_ID = new Map(studyIndex.files.map(file => [file.id, file]));
const OWNED_COPIES = new Map(Object.entries({ ...ownedPartA.originalToCopy, ...ownedPartB.originalToCopy }));
const ALLOWED_DRIVE_HOSTS = new Set([
  "drive.google.com",
  "drive.usercontent.google.com",
  "docs.google.com",
]);
const MAX_DOWNLOAD_BYTES = 250 * 1024 * 1024;

export function findStudyFile(id) {
  return /^[a-zA-Z0-9_-]+$/.test(id || "") ? FILES_BY_ID.get(id) || null : null;
}

export function isTrustedDriveDownloadUrl(input) {
  try {
    const u = new URL(input);
    return u.protocol === "https:" &&
      (ALLOWED_DRIVE_HOSTS.has(u.hostname) ||
      u.hostname === "googleusercontent.com" ||
      u.hostname.endsWith(".googleusercontent.com"));
  } catch {
    return false;
  }
}

export function driveSourceUrls(fileId) {
  if (!findStudyFile(fileId)) return [];
  const id = encodeURIComponent(fileId);
  return [
    `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&confirm=t&id=${id}`,
  ];
}

/** All copied IDs are verified against original titles, grade and content folder. */
export function ownedDriveCopyId(sourceId) {
  return findStudyFile(sourceId) ? OWNED_COPIES.get(sourceId) || null : null;
}

export function ownedDriveMappingStats() {
  return { original: FILES_BY_ID.size, copied: OWNED_COPIES.size };
}

/**
 * Preserve working public source downloads until the owner enables public
 * read access on the MauriResults Drive root folder. After access is verified,
 * preferOwnCopy=true chooses the newly copied file first, retaining the
 * original as an availability fallback.
 */
export function driveDownloadCandidates(sourceId, preferOwnCopy = false) {
  if (!findStudyFile(sourceId)) return [];
  const ownedId = ownedDriveCopyId(sourceId);
  const ids = preferOwnCopy && ownedId ? [ownedId, sourceId] :
    ownedId ? [sourceId, ownedId] : [sourceId];
  return ids.flatMap(id => [
    `https://drive.usercontent.google.com/download?id=${encodeURIComponent(id)}&export=download&confirm=t`,
    `https://drive.google.com/uc?export=download&confirm=t&id=${encodeURIComponent(id)}`,
  ]);
}

export function safeStudyFilename(file) {
  const extension = file.fileType === "DOC" ? ".doc"
    : file.fileType === "DOCX" ? ".docx" : ".pdf";
  let base = String(file.title || "document")
    .replace(/\.(pdf|docx?)$/i, "")
    .replace(/[\\/:*?"<>|\u0000-\u001f\u007f]/g, "-")
    .replace(/\s+/g, " ").trim().slice(0, 140);
  if (!base) base = "document";
  return base + extension;
}

export function allowedStudyFileLength(value) {
  if (value === null || value === "") return true;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 && n <= MAX_DOWNLOAD_BYTES;
}
