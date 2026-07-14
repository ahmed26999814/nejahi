const CACHE_NAME = "mauriresults-v14-app-shell";
const RUNTIME_CACHE = "mauriresults-v14-runtime";
const APP_SHELL = ["/offline.html", "/logo.png", "/manifest.webmanifest"];
const STATIC_PATHS = ["/images/", "/icons/", "/logo.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      )),
      self.registration.navigationPreload?.enable?.(),
    ]).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

function isCacheableStatic(url) {
  return STATIC_PATHS.some((path) => url.pathname === path || url.pathname.startsWith(path));
}

async function networkFirstNavigation(event) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    const preload = await event.preloadResponse;
    if (preload) return preload;
    return await fetch(event.request, { signal: controller.signal, cache: "no-store" });
  } catch {
    return (await caches.match("/offline.html")) || Response.error();
  } finally {
    clearTimeout(timeout);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok && response.type === "basic") cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);

  return cached || (await network) || Response.error();
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(event));
    return;
  }

  if (isCacheableStatic(url)) {
    event.respondWith(staleWhileRevalidate(event.request));
  }
});
