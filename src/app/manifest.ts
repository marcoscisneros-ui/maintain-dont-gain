import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Maintain, Don't Gain",
    short_name: "Don't Gain",
    description: "Our 7-week holiday challenge.",
    start_url: "/home",
    display: "standalone",
    background_color: "#f5f4f1",
    theme_color: "#ff4f2e",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
