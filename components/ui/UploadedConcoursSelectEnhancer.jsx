"use client";

import { useEffect } from "react";

const optionCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000;

function sourceFromStorage() {
  const examId = localStorage.getItem("mauriresults-selected-exam") || "";
  if (examId.startsWith("upload-")) return `upload:${examId.slice("upload-".length)}`;
  return "";
}

async function resolveSource() {
  const stored = sourceFromStorage();
  if (stored) return stored;

  try {
    const response = await fetch("/api/public-exams", { headers: { Accept: "application/json" } });
    const data = await response.json();
    const heading = document.querySelector("main h1")?.textContent || "";
    const match = (data.exams || []).find((exam) =>
      exam.search_mode === "concours" &&
      (heading.includes(String(exam.title_ar || "")) || heading.includes(String(exam.title_fr || "")))
    );
    return match?.source_key || "";
  } catch {
    return "";
  }
}

function setReactInputValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function fetchOptions(source, level, wilaya = "", moughataa = "") {
  const key = `${source}|${level}|${wilaya}|${moughataa}`;
  const cached = optionCache.get(key);
  if (cached && Date.now() - cached.savedAt < CACHE_TTL_MS) return cached.options;

  const params = new URLSearchParams({ source, level });
  if (wilaya) params.set("wilaya", wilaya);
  if (moughataa) params.set("moughataa", moughataa);
  const response = await fetch(`/api/uploaded-concours-locations?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "تعذر تحميل الخيارات");
  const options = [...new Set((Array.isArray(data.options) ? data.options : []).filter(Boolean))];
  optionCache.set(key, { options, savedAt: Date.now() });
  return options;
}

function fillSelect(select, placeholder, options) {
  select.replaceChildren();
  const first = document.createElement("option");
  first.value = "";
  first.textContent = placeholder;
  select.appendChild(first);
  for (const value of options) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = String(value);
    select.appendChild(option);
  }
}

function createSelect(input, placeholder, disabled = false) {
  input.parentElement?.querySelector("select[data-uploaded-concours-select]")?.remove();
  const select = document.createElement("select");
  select.dataset.uploadedConcoursSelect = "true";
  select.className = `${input.className} uploaded-concours-guided-select`;
  select.disabled = disabled;
  select.setAttribute("aria-label", placeholder);
  fillSelect(select, placeholder, []);
  input.hidden = true;
  input.setAttribute("aria-hidden", "true");
  input.insertAdjacentElement("afterend", select);
  return select;
}

function findUploadedConcoursForm() {
  return [...document.querySelectorAll("form.search-card")].find((form) => {
    if (form.dataset.guidedChoices === "ready" || form.dataset.guidedChoices === "loading") return false;
    const labels = form.textContent || "";
    const inputs = [...form.querySelectorAll("input")].filter((input) => !input.hidden);
    return inputs.length === 4 && /الولاية|région/i.test(labels) && /المقاطعة|département/i.test(labels) && /مركز|centre/i.test(labels);
  });
}

export default function UploadedConcoursSelectEnhancer() {
  useEffect(() => {
    let stopped = false;
    let running = false;
    let timers = [];

    async function enhance() {
      if (running || stopped) return;
      const form = findUploadedConcoursForm();
      if (!form) return;
      const source = await resolveSource();
      if (!source || stopped) return;

      const inputs = [...form.querySelectorAll("input")].filter((input) => !input.hidden);
      if (inputs.length !== 4) return;
      const [wilayaInput, moughataaInput, centreInput] = inputs;

      running = true;
      form.dataset.guidedChoices = "loading";
      const wilayaSelect = createSelect(wilayaInput, "جاري تحميل الولايات...", true);
      const moughataaSelect = createSelect(moughataaInput, "اختر المقاطعة", true);
      const centreSelect = createSelect(centreInput, "اختر مركز الامتحان", true);

      try {
        const wilayas = await fetchOptions(source, "wilaya");
        if (stopped || !wilayas.length) throw new Error("لم يتم العثور على ولايات");
        fillSelect(wilayaSelect, "اختر الولاية", wilayas);
        wilayaSelect.disabled = false;
        form.dataset.guidedChoices = "ready";
        form.dataset.guidedSource = source;

        wilayaSelect.addEventListener("change", async () => {
          const selectedWilaya = wilayaSelect.value;
          setReactInputValue(wilayaInput, selectedWilaya);
          setReactInputValue(moughataaInput, "");
          setReactInputValue(centreInput, "");
          fillSelect(moughataaSelect, selectedWilaya ? "جاري تحميل المقاطعات..." : "اختر المقاطعة", []);
          fillSelect(centreSelect, "اختر مركز الامتحان", []);
          moughataaSelect.disabled = true;
          centreSelect.disabled = true;
          if (!selectedWilaya) return;
          try {
            const options = await fetchOptions(source, "moughataa", selectedWilaya);
            fillSelect(moughataaSelect, "اختر المقاطعة", options);
            moughataaSelect.disabled = !options.length;
          } catch {
            fillSelect(moughataaSelect, "تعذر تحميل المقاطعات", []);
          }
        });

        moughataaSelect.addEventListener("change", async () => {
          const selectedMoughataa = moughataaSelect.value;
          setReactInputValue(moughataaInput, selectedMoughataa);
          setReactInputValue(centreInput, "");
          fillSelect(centreSelect, selectedMoughataa ? "جاري تحميل المراكز..." : "اختر مركز الامتحان", []);
          centreSelect.disabled = true;
          if (!selectedMoughataa) return;
          try {
            const options = await fetchOptions(source, "centre", wilayaSelect.value, selectedMoughataa);
            fillSelect(centreSelect, "اختر مركز الامتحان", options);
            centreSelect.disabled = !options.length;
          } catch {
            fillSelect(centreSelect, "تعذر تحميل المراكز", []);
          }
        });

        centreSelect.addEventListener("change", () => setReactInputValue(centreInput, centreSelect.value));
      } catch (error) {
        console.error("[Uploaded Concours Choices]", error);
        form.dataset.guidedChoices = "error";
        [wilayaInput, moughataaInput, centreInput].forEach((input) => {
          input.hidden = false;
          input.removeAttribute("aria-hidden");
        });
        wilayaSelect.remove();
        moughataaSelect.remove();
        centreSelect.remove();
      } finally {
        running = false;
      }
    }

    const schedule = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = [0, 90, 260].map((delay) => window.setTimeout(enhance, delay));
    };

    schedule();
    window.addEventListener("mauriresults:routechange", schedule);
    window.addEventListener("hashchange", schedule, { passive: true });
    window.addEventListener("popstate", schedule, { passive: true });

    return () => {
      stopped = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      window.removeEventListener("mauriresults:routechange", schedule);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("popstate", schedule);
    };
  }, []);

  return null;
}
