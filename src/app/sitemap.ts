import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/catalog";
import { env } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, categories } = await getSitemapData();
  return [
    { url: `${env.siteUrl}/`, changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({ url: `${env.siteUrl}/categoria/${c.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...products.map((p) => ({ url: `${env.siteUrl}/produto/${p.slug}`, lastModified: p.updated_at, priority: 0.6 })),
  ];
}
