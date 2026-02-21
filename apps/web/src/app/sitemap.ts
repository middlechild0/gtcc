import type { MetadataRoute } from "next";

export const baseUrl = "https://visyx.co.ke";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date().toISOString().split("T")[0];

  // Static routes
  const staticRoutes = [
    "",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified,
  }));

  return [...staticRoutes];
}
