"use client";

import { useEffect } from "react";

function sourceFromStorage() {
  const examId = localStorage.getItem("mauriresults-selected-exam") || "";
  if (examId.startsWith("upload-")) return `upload:${examId.slice("upload-".length)}`;
  return "";
}

async function resolveSource(form) {
  const stored = sourceFromStorage();
  if (stored) return stored;

  try {
    const response = await fetch("/api/public-exams", { cache: "no-store" });
    const data = await response.json();
    const pageText = document.body.textContent || "";
    const match = (data.exams || []).find((exam) =>
      exam.search_mode === "concours" &&
      (pageText.includes(String(exam.title_ar || "")) || pageText.includes(String(exam.title_fr || "")))
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
  const params = new URLSearchParams({ source, level });
  if (wilaya) params.set("wilaya", wilaya);
  if (moughataa) params.set("moughataa", moughataa);
  const response = await fetch(`/api/uploaded-concours-locations?${params.toString()}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "تعذر تحميل الخيارات");
  const options = Array.isArray(data.options) ? data.options.filter(Boolean) : [];
  return [...new Set(options)];
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
  const old = input.parentElement?.querySelector("select[data-uploaded-concours-select]");
  old?.remove();

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
    const labels = form.textContent || "";
    const inputs = [...form.querySelectorAll("input")].filter((input) => !input.hidden);
    return inputs.length === 4 && labels.includes("الولاية") && labels.includes("المقاطعة") && labels.includes("مركز");
  });
}

export default function UploadedConcoursSelectEnhancer() {
  useEffect(() => {
    let stopped = false;
    let timer = 0;
    let running = false;

    async function enhance() {
      if (running || stopped) return;
      const form = findUploadedConcoursForm();
      if (!form || form.dataset.guidedChoices === "ready" || form.dataset.guidedChoices === "loading") return;

      const source = await resolveSource(form);
      if (!source) return;

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
        if (stopped) return;
        if (!wilayas.length) throw new Error("لم يتم العثور على ولايات");

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

        centreSelect.addEventListener("change", () => {
          setReactInputValue(centreInput, centreSelect.value);
        });
      } catch (error) {
        console.error("[Uploaded Concours Choices]", error);
        form.dataset.guidedChoices = "error";
        wilayaInput.hidden = false;
        moughataaInput.hidden = false;
        centreInput.hidden = false;
        wilayaInput.removeAttribute("aria-hidden");
        moughataaInput.removeAttribute("aria-hidden");
        centreInput.removeAttribute("aria-hidden");
        wilayaSelect.remove();
        moughataaSelect.remove();
        centreSelect.remove();
      } finally {
        running = false;
      }
    }

    function schedule(delay = 60) {
      clearTimeout(timer);
      timer = window.setTimeout(enhance, delay);
    }

    schedule(0);
    const observer = new MutationObserver(() => schedule(80));
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("hashchange", () => schedule(0));
    window.addEventListener("popstate", () => schedule(0));
    document.addEventListener("click", () => schedule(120), true);

    return () => {
      stopped = true;
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
