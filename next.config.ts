import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // As fotos de origem já são .avif; mantemos avif/webp na otimização.
    formats: ["image/avif", "image/webp"],
    // Larguras usadas pelo next/image para gerar os srcsets responsivos.
    deviceSizes: [360, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [96, 160, 240, 320, 480, 640],
  },
};

export default nextConfig;
