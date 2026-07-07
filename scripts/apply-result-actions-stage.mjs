import { readFileSync, writeFileSync } from "node:fs";

const file = "app/page.jsx";
let source = readFileSync(file, "utf8");
const original = source;
const importLine = 'import ResultShareActions from "../components/results/ResultShareActions";';
const anchor = 'import ResultOfficialSummary from "../components/results/ResultOfficialSummary";';
const fallback = 'import { CandidateProfileCard, StatusBadge } from "../components/results/ResultDesignKit";';

if (!source.includes(importLine)) {
  if (source.includes(anchor)) {
    source = source.replace(anchor, `${anchor}\n${importLine}`);
  } else {
    source = source.replace(fallback, `${fallback}\n${importLine}`);
  }
}

const returnMark = `  return (
    <article className={`;
const actionsCode = `  const primaryActions = [
    { icon: <ShareIcon />, label: text.share, onClick: () => onShare(student), variant: "solid" },
    { icon: <DownloadIcon />, label: "PDF", onClick: () => window.print() },
    { icon: <PrinterIcon />, label: text.print, onClick: () => window.print() },
  ];
  const socialActions = [
    { icon: <HashIcon />, label: text.copyLink, onClick: () => { navigator.clipboard?.writeText(resultUrl); toast.success(text.copiedShare); } },
    { icon: <FaWhatsapp />, label: text.whatsapp, onClick: () => window.open(` + "`" + `https://wa.me/?text=${encodedText}%0A${encodedUrl}` + "`" + `, "_blank", "noopener,noreferrer") },
    { icon: <FaFacebookF />, label: text.facebook, onClick: () => window.open(` + "`" + `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` + "`" + `, "_blank", "noopener,noreferrer") },
    { icon: <FaTelegram />, label: text.telegram, onClick: () => window.open(` + "`" + `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` + "`" + `, "_blank", "noopener,noreferrer") },
  ];

`;

if (!source.includes("const primaryActions = [") && source.includes(returnMark)) {
  source = source.replace(returnMark, actionsCode + returnMark);
}

const oldPrimary = `<div className="mt-4 grid grid-cols-3 gap-2">
        <ActionButton icon={<ShareIcon />} label={text.share} onClick={() => onShare(student)} />
        <ActionButton icon={<DownloadIcon />} label="PDF" onClick={() => window.print()} variant="light" />
        <ActionButton icon={<PrinterIcon />} label={text.print} onClick={() => window.print()} variant="light" />
      </div>`;
const newPrimary = `<div className="mt-4">
        <ResultShareActions actions={primaryActions} compact />
      </div>`;

if (source.includes(oldPrimary) && !source.includes("actions={primaryActions}")) {
  source = source.replace(oldPrimary, newPrimary);
}

const oldSocial = `<div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ActionButton icon={<HashIcon />} label={text.copyLink} onClick={() => { navigator.clipboard?.writeText(resultUrl); toast.success(text.copiedShare); }} variant="light" />
        <ActionButton icon={<FaWhatsapp />} label={text.whatsapp} onClick={() => window.open(` + "`" + `https://wa.me/?text=${encodedText}%0A${encodedUrl}` + "`" + `, "_blank", "noopener,noreferrer")} variant="light" />
        <ActionButton icon={<FaFacebookF />} label={text.facebook} onClick={() => window.open(` + "`" + `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` + "`" + `, "_blank", "noopener,noreferrer")} variant="light" />
        <ActionButton icon={<FaTelegram />} label={text.telegram} onClick={() => window.open(` + "`" + `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` + "`" + `, "_blank", "noopener,noreferrer")} variant="light" />
      </div>`;
const newSocial = `<div className="mt-4">
        <ResultShareActions actions={socialActions} compact />
      </div>`;

if (source.includes(oldSocial) && !source.includes("actions={socialActions}")) {
  source = source.replace(oldSocial, newSocial);
}

if (source !== original) {
  writeFileSync(file, source, "utf8");
  console.log("Result share actions connected.");
} else {
  console.log("Result share actions already connected or target block changed.");
}
