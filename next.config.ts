import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  workboxOptions: {
    // PGlite WASM (~10 Mo) doit être précaché pour l'offline complet
    maximumFileSizeToCacheInBytes: 15 * 1024 * 1024,
  },
});

const nextConfig: NextConfig = {
  // PGlite (WASM) ne doit pas être bundlé côté serveur
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default withPWA(nextConfig);
