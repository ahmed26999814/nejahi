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

function publicResource(input) {
  try {
    const raw = typeof input === "string" || input instanceof URL ? input : input?.url;
    if (!raw) return "";
    const url = new URL(raw, window.location.origin);
    if (!url.hostname.endsWith(".supabase.co") || !url.pathname.startsWith("/rest/v1/")) return "";
    const resource = decodeURIComponent(url.pathname.slice("/rest/v1/".length)).split("/")[0];
    return PUBLIC_RESOURCES.has(resource) ? resource : "";
  } catch {
    return "";
  }
}

export default function PublicDataFetchBridge() {
  useLayoutEffect(() => {
    if (window.location.pathname.startsWith("/admin")) return undefined;

    const originalFetch = window.fetch.bind(window);

    window.fetch = (input, init = {}) => {
      const method = String(init?.method || (typeof input === "object" && input?.method) || "GET").toUpperCase();
      const resource = method === "GET" ? publicResource(input) : "";
      if (!resource) return originalFetch(input, init);

      const headers = new Headers(init?.headers || (typeof input === "object" ? input?.headers : undefined));
      headers.delete("apikey");
      headers.delete("authorization");
      headers.set("Accept", "application/json");

      return originalFetch(`/api/public-data?resource=${encodeURIComponent(resource)}`, {
        ...init,
        method: "GET",
        headers,
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
