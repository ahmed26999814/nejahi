// Production rebuild trigger: Flutter 3.0.0 mandatory update release.
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
        source: "/apk",
        destination: "/Apk/",
        permanent: false,
      },
      {
        source: "/apk/MauriResults.apk",
        destination: "https://raw.githubusercontent.com/ahmed26999814/nejahi-mobile/main/release/MauriResults.apk",
        permanent: false,
      },
    ];
  },
  async headers() {
    return [
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
          { key: "Cache-Control", value: "public, s-maxage=120, stale-while-revalidate=600" },
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
