const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "**.supabase.co";

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
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
          { key: "Cache-Control", value: "public, s-maxage=300, stale-while-revalidate=1800" },
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
