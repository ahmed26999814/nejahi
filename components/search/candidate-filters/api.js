const optionCache = new Map();
const pendingRequests = new Map();
const OPTION_CACHE_TTL = 30 * 60 * 1000;

function requestKey(params) {
  return new URLSearchParams(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .sort(([a], [b]) => a.localeCompare(b))
  ).toString();
}

export async function fetchCandidateFilterData(params, signal) {
  const isOptionsRequest = params.mode === "options";
  const key = requestKey(params);

  if (isOptionsRequest) {
    const cached = optionCache.get(key);
    if (cached && Date.now() - cached.savedAt < OPTION_CACHE_TTL) {
      return cached.data;
    }

    const pending = pendingRequests.get(key);
    if (pending) return pending;
  }

  const request = fetch(`/api/forgot-number?${key}`, {
    cache: isOptionsRequest ? "force-cache" : "no-store",
    signal,
    headers: {
      Accept: "application/json",
    },
  })
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "تعذر تحميل بيانات التصفية");
      }

      if (isOptionsRequest) {
        optionCache.set(key, { data, savedAt: Date.now() });
      }

      return data;
    })
    .finally(() => {
      if (isOptionsRequest) pendingRequests.delete(key);
    });

  if (isOptionsRequest) pendingRequests.set(key, request);
  return request;
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
