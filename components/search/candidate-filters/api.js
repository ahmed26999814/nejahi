export async function fetchCandidateFilterData(params, signal) {
  const response = await fetch(`/api/forgot-number?${new URLSearchParams(params)}`, {
    cache: "force-cache",
    signal,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "تعذر تحميل بيانات التصفية");
  }

  return data;
}

export function findSingleSearchForm() {
  return [...document.querySelectorAll("form.search-card")].find((form) =>
    [...form.querySelectorAll("input")].filter((input) => !input.hidden).length === 1
  );
}

export function findCandidateFilterTarget() {
  return findSingleSearchForm()?.parentElement || null;
}

export function submitCandidateNumber(number) {
  const form = findSingleSearchForm();
  const input = form?.querySelector("input");
  if (!form || !input) return;

  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set?.call(input, number);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
  form.requestSubmit();

  window.scrollTo({
    top: form.getBoundingClientRect().top + window.scrollY - 90,
    behavior: "smooth",
  });
}
