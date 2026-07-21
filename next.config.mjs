// Production rebuild trigger: Flutter 3.1.0 mandatory update release.
const DEFAULT_SUPABASE_URL = "https://nxizqnlemsbjmsfyuevg.supabase.co";

function usableEnvironmentValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (raw === "[SENSITIVE]" || raw === "[REDACTED]") return "";
  if (/^your[_-]/i.test(raw) || raw.includes("your_supabase")) return "";
  return raw;
}

function resolveSupabaseUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_URL,
    DEFAULT_SUPABASE_URL,
  ];

  for (const candidate of candidates) {
    const raw = usableEnvironmentValue(candidate);
    if (!raw) continue;
    try {
      const url = new URL(raw);
      if (url.protocol === "https:" && url.hostname.endsWith(".supabase.co")) {
        return url.origin;
      }
    } catch {}
  }

  return DEFAULT_SUPABASE_URL;
}

function resolveSupabaseHost(value) {
  try {
    return new URL(value).hostname;
  } catch {
    return "**.supabase.co";
  }
}

const publicSupabaseUrl = resolveSupabaseUrl();
const publicSupabaseAnonKey = usableEnvironmentValue(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
);
const supabaseHost = resolveSupabaseHost(publicSupabaseUrl);

// Next.js inlines NEXT_PUBLIC_* variables during the build. Never allow Vercel's
// redaction placeholder to be compiled into browser or server bundles.
process.env.NEXT_PUBLIC_SUPABASE_URL = publicSupabaseUrl;
if (publicSupabaseAnonKey) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = publicSupabaseAnonKey;
}

const RESULT_CACHE = "public, max-age=300, s-maxage=86400, stale-while-revalidate=604800, stale-if-error=604800";
const NO_STORE = "no-store, max-age=0";
const PRIVATE_RESULT_ROBOTS = "noindex, nofollow, noarchive";

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_SUPABASE_URL: publicSupabaseUrl,
    ...(publicSupabaseAnonKey
      ? { NEXT_PUBLIC_SUPABASE_ANON_KEY: publicSupabaseAnonKey }
      : {}),
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "lucide-react",
      "react-icons",
      "@radix-ui/react-select",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/Apk",
        destination: "/apk",
        permanent: true,
      },
      {
        source: "/apk/MauriResults.apk",
        destination: "/apk/MauriResults-3.1.0.apk",
        permanent: false,
      },
      {
        source: "/apk/MauriResults-3.0.0.apk",
        destination: "/apk/MauriResults-3.1.0.apk",
        permanent: false,
      },
      {
        source: "/apk/MauriResults-2.1.0.apk",
        destination: "/apk/MauriResults-3.1.0.apk",
        permanent: false,
      },
      {
        source: "/apk/MauriResults-2.0.0.apk",
        destination: "/apk/MauriResults-3.1.0.apk",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/apk",
        destination: "/Apk",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/",
        has: [{ type: "query", key: "candidate" }],
        headers: [{ key: "X-Robots-Tag", value: PRIVATE_RESULT_ROBOTS }],
      },
      {
        source: "/",
        has: [{ type: "query", key: "source" }],
        headers: [{ key: "X-Robots-Tag", value: PRIVATE_RESULT_ROBOTS }],
      },
      {
        source: "/apk/version.json",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/apk/MauriResults-3.1.0.apk",
        headers: [
          { key: "Content-Type", value: "application/vnd.android.package-archive" },
          { key: "Content-Disposition", value: 'attachment; filename="MauriResults-3.1.0.apk"' },
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/api/public-exams",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=60, stale-while-revalidate=3600" },
        ],
      },
      {
        source: "/api/public-data",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=86400" },
        ],
      },
      {
        source: "/api/site-controls",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=3600" },
        ],
      },
      {
        source: "/api/search",
        headers: [
          { key: "Cache-Control", value: NO_STORE },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
          { key: "Netlify-CDN-Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/uploaded-concours-search",
        headers: [
          { key: "Cache-Control", value: NO_STORE },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
          { key: "Netlify-CDN-Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/api/result-number/:path*",
        headers: [
          { key: "Cache-Control", value: RESULT_CACHE },
        ],
      },
      {
        source: "/api/concours-number/:path*",
        headers: [
          { key: "Cache-Control", value: RESULT_CACHE },
        ],
      },
      {
        source: "/api/site-assets",
        headers: [
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=1800" },
        ],
      },
    ];
  },
};

export default nextConfig;
