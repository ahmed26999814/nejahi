"use client";

import { useLayoutEffect } from "react";

const PUBLIC_RESOURCES = new Set([
  "site_content",
  "bac_stats",
  "bac_region_stats",
  "bac_school_stats",
  "bac_track_stats",
  "bac_top_students",
  "brevet_stats",
  "brevet_region_stats",
  "brevet_school_stats",
  "brevet_top_students",
  "concours_stats",
  "concours_region_stats",
  "concours_moughataa_stats",
  "concours_school_stats",
  "concours_top_students",
  "excellence_1as_stats",
  "excellence_1as_region_stats",
  "excellence_1as_top_students",
  "bac_session2_stats",
  "bac_session2_region_stats",
  "bac_session2_track_stats",
  "bac_session2_top_students",
]);

const BUILTIN_SOURCES = new Set(["bac", "brevet", "concours", "bac_session", "excellence_1as"]);

function resolveUrl(input) {
  try {
    const raw = typeof input === "string" || input instanceof URL ? input : input?.url;
    return raw ? new URL(raw, window.location.origin) : null;
  } catch {
    return null;
  }
}

function publicResource(input) {
  const url = resolveUrl(input);
  if (!url || !url.hostname.endsWith(".supabase.co") || !url.pathname.startsWith("/rest/v1/")) return "";
  const resource = decodeURIComponent(url.pathname.slice("/rest/v1/".length)).split("/")[0];
  return PUBLIC_RESOURCES.has(resource) ? resource : "";
}

function asciiDigits(value) {
  const arabic = "٠١٢٣٤٥٦٧٨٩";
  const persian = "۰۱۲۳۴۵۶۷۸۹";
  return String(value || "")
    .replace(/[٠-٩]/g, (digit) => String(arabic.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(persian.indexOf(digit)));
}

function candidateNumber(value) {
  const digits = asciiDigits(value).trim().slice(0, 20);
  if (!/^\d{1,20}$/.test(digits)) return "";
  return digits.replace(/^0+(?=\d)/, "");
}

function sourceToken(value) {
  const source = String(value || "").trim();
  if (BUILTIN_SOURCES.has(source)) return source;
  if (/^upload:[A-Za-z_][A-Za-z0-9_]{1,62}$/.test(source)) {
    return `upload--${source.slice("upload:".length)}`;
  }
  return "";
}

function resultRequest(input) {
  const url = resolveUrl(input);
  if (!url || url.origin !== window.location.origin) return null;
  if (!["/api/search", "/api/uploaded-concours-search"].includes(url.pathname)) return null;
  return {
    source: String(url.searchParams.get("source") || ""),
    url,
  };
}

function cacheSafeResultPath(request) {
  if (!request) return "";
  const token = sourceToken(request.source);
  if (!token) return "";

  if (request.url.pathname === "/api/search") {
    const number = candidateNumber(request.url.searchParams.get("q"));
    return number
      ? `/api/result-number/${encodeURIComponent(token)}/${encodeURIComponent(number)}`
      : "";
  }

  const number = candidateNumber(request.url.searchParams.get("number"));
  const wilaya = String(request.url.searchParams.get("wilaya") || "").trim();
  const moughataa = String(request.url.searchParams.get("moughataa") || "").trim();
  const centre = String(request.url.searchParams.get("centre") || "").trim();
  if (![number, wilaya, moughataa, centre].every(Boolean)) return "";

  return [
    "/api/concours-number",
    encodeURIComponent(token),
    encodeURIComponent(wilaya),
    encodeURIComponent(moughataa),
    encodeURIComponent(centre),
    encodeURIComponent(number),
  ].join("/");
}

function rowIds(row) {
  return [
    row?.id,
    row?.Numero,
    row?.["Numéro"],
    row?.Num_Bepc,
    row?.Num_Excellence_1AS,
    row?.["Numéro_C1AS"],
    row?.Numero_C1AS,
    row?.NODOSS,
  ].map((value) => String(value || "").trim()).filter(Boolean);
}

function rememberRows(request, response) {
  if (!request || !response?.ok) return;
  response.clone().json().then((data) => {
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    if (!rows.length) return;
    if (!(window.__mauriResultRows instanceof Map)) window.__mauriResultRows = new Map();
    rows.forEach((row) => {
      rowIds(row).forEach((id) => {
        window.__mauriResultRows.set(`${request.source}:${id}`, row);
        window.__mauriResultRows.set(`*:${id}`, row);
      });
    });
    window.dispatchEvent(new CustomEvent("mauriresults:raw-result", { detail: { source: request.source, count: rows.length } }));
  }).catch(() => {});
}

export default function PublicDataFetchBridge() {
  useLayoutEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return undefined;

    const originalFetch = window.fetch.bind(window);

    window.fetch = (input, init = {}) => {
      const method = String(init?.method || (typeof input === "object" && input?.method) || "GET").toUpperCase();
      const resource = method === "GET" ? publicResource(input) : "";
      const trackedResult = method === "GET" ? resultRequest(input) : null;

      if (resource) {
        const headers = new Headers(init?.headers || (typeof input === "object" ? input?.headers : undefined));
        headers.delete("apikey");
        headers.delete("authorization");
        headers.set("Accept", "application/json");

        return originalFetch(`/api/public-data?resource=${encodeURIComponent(resource)}`, {
          ...init,
          method: "GET",
          headers,
        });
      }

      const directPath = cacheSafeResultPath(trackedResult);
      const promise = originalFetch(directPath || input, init);
      if (!trackedResult) return promise;
      return promise.then((response) => {
        rememberRows(trackedResult, response);
        return response;
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
