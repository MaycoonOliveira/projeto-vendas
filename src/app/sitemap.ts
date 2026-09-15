import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes = [
    { path: "/", priority: 1, changeFrequency: "monthly" as const },
    { path: "/acomodacoes", priority: 0.9, changeFrequency: "monthly" as const },
    { path: "/galeria", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/localizacao", priority: 0.7, changeFrequency: "yearly" as const },
    { path: "/contato", priority: 0.7, changeFrequency: "yearly" as const },
  ];

  return routes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
