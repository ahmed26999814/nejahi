"use client";

import { useEffect } from "react";

function selectedSource() {
  const examId = localStorage.getItem("mauriresults-selected-exam") || "";
  if (!examId.startsWith("upload-")) return "";
  return `upload:${examId.slice("upload-".length)}`;
}

function setNativeValue(input, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

async function fetchOptions(source, level, wilaya = "", moughataa = "") {
  const params = new URLSearchParams({ source, level });
  if (wilaya) params.set("wilaya", wilaya);
  if (moughataa) params.set("moughataa", moughataa);
  const response = await fetch(`/api/uploaded-concours-locations?${params}`, { cache: "no-store" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "تعذر تحميل الخيارات");
  return Array.isArray(data.options) ? data.options : [];
}

function buildSelect(input, label, options, disabled) {
  const select = document.createElement("select");
  select.className = `${input.className} uploaded-concours-guided-select`;
  select.disabled = disabled;
  select.setAttribute("aria-label", label);
  select.innerHTML = `<option value="">${label}</option>${options.map((option) => `<option value="${String(option).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;")}">${String(option).replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</option>`).join("")}`;
  select.value = input.value || "";
  input.style.display = "none";
  input.insertAdjacentElement("afterend", select);
  return select;
}

function findUploadedConcoursForm() {
  return [...document.querySelectorAll("form.search-card")].find((form) => {
    const labels = form.textContent || "";
    const inputs = form.querySelectorAll("input");
    return inputs.length === 4 && labels.includes("الولاية") && labels.includes("المقاطعة") && labels.includes("مركز");
  });
}

export default function UploadedConcoursSelectEnhancer() {
  useEffect(() => {
    let cancelled = false;
    let timer = 0;

    async function enhance() {
      const form = findUploadedConcoursForm();
      if (!form || form.dataset.guidedChoices === "true") return;
      const source = selectedSource();
      if (!source) return;

      const inputs = [...form.querySelectorAll("input")];
      if (inputs.length !== 4) return;
      const [wilayaInput, moughataaInput, centreInput] = inputs;
      form.dataset.guidedChoices = "true";

      try {
        const wilayas = await fetchOptions(source, "wilaya");
        if (cancelled) return;
        const wilayaSelect = buildSelect(wilayaInput, "اختر الولاية", wilayas, false);
        const moughataaSelect = buildSelect(moughataaInput, "اختر المقاطعة", [], true);
        const centreSelect = buildSelect(centreInput, "اختر مركز الامتحان", [], true);

        wilayaSelect.addEventListener("change", async () => {
          setNativeValue(wilayaInput, wilayaSelect.value);
          setNativeValue(moughataaInput, "");
          setNativeValue(centreInput, "");
          moughataaSelect.innerHTML = '<option value="">اختر المقاطعة</option>';
          centreSelect.innerHTML = '<option value="">اختر مركز الامتحان</option>';
          centreSelect.disabled = true;
          moughataaSelect.disabled = !wilayaSelect.value;
          if (!wilayaSelect.value) return;
          const options = await fetchOptions(source, "moughataa", wilayaSelect.value);
          moughataaSelect.innerHTML = `<option value="">اختر المقاطعة</option>${options.map((option) => `<option>${option}</option>`).join("")}`;
        });

        moughataaSelect.addEventListener("change", async () => {
          setNativeValue(moughataaInput, moughataaSelect.value);
          setNativeValue(centreInput, "");
          centreSelect.innerHTML = '<option value="">اختر مركز الامتحان</option>';
          centreSelect.disabled = !moughataaSelect.value;
          if (!moughataaSelect.value) return;
          const options = await fetchOptions(source, "centre", wilayaSelect.value, moughataaSelect.value);
          centreSelect.innerHTML = `<option value="">اختر مركز الامتحان</option>${options.map((option) => `<option>${option}</option>`).join("")}`;
        });

        centreSelect.addEventListener("change", () => {
          setNativeValue(centreInput, centreSelect.value);
        });
      } catch (error) {
        console.error("[Uploaded Concours Choices]", error);
        delete form.dataset.guidedChoices;
      }
    }

    const schedule = () => {
      clearTimeout(timer);
      timer = window.setTimeout(enhance, 80);
    };

    schedule();
    document.addEventListener("click", schedule, true);
    window.addEventListener("hashchange", schedule);
    window.addEventListener("popstate", schedule);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("click", schedule, true);
      window.removeEventListener("hashchange", schedule);
      window.removeEventListener("popstate", schedule);
    };
  }, []);

  return null;
}
