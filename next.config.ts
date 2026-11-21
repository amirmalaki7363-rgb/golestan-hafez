import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  // Slim the deployable standalone bundle (publish artifact size matters):
  // 1. Prisma bundles WASM engines for EVERY provider (~55MB); we only use
  //    sqlite, so drop the other providers' runtimes.
  // 2. typescript is a dev-time tool; not needed by the production server.
  // 3. sharp ships glibc + musl (Alpine) binaries; the deploy target is
  //    debian/glibc x64, so the musl variants are dead weight.
  outputFileTracingExcludes: {
    "*": [
      "node_modules/@prisma/client/runtime/query_compiler_bg.cockroachdb*",
      "node_modules/@prisma/client/runtime/query_compiler_bg.mysql*",
      "node_modules/@prisma/client/runtime/query_compiler_bg.postgresql*",
      "node_modules/@prisma/client/runtime/query_compiler_bg.sqlserver*",
      "node_modules/@prisma/client/runtime/query_engine_bg.cockroachdb*",
      "node_modules/@prisma/client/runtime/query_engine_bg.mysql*",
      "node_modules/@prisma/client/runtime/query_engine_bg.postgresql*",
      "node_modules/@prisma/client/runtime/query_engine_bg.sqlserver*",
      "node_modules/typescript/**",
      "node_modules/@img/sharp-linuxmusl-x64/**",
      "node_modules/@img/sharp-libvips-linuxmusl-x64/**",
    ],
  },
  reactStrictMode: false,
  // Allow the sandbox preview origins (preview panel / new tab) to fetch
  // /_next/* dev assets cross-origin without warnings or blocks.
  allowedDevOrigins: ["*.space-z.ai"],
  images: {
    // 90 is used by the product image lightbox for a crisper zoomed view.
    qualities: [75, 90],
    // In dev, skip the /_next/image optimizer hop entirely: every image
    // request through the preview gateway used to pay an extra round trip
    // plus on-demand sharp processing. All sources under /images are
    // pre-compressed with sharp (scripts/optimize-images.ts), so serving
    // them directly is both fast and correctly sized. The optimizer stays
    // enabled in production builds.
    unoptimized: process.env.NODE_ENV === "development",
    // CSV-imported products may carry external image URLs («آدرس تصویر»);
    // allow any http(s) host so next/image can optimize them.
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
  },
};

export default nextConfig;
