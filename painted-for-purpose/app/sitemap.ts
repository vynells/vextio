import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return ["", "/about", "/impact", "/shop", "/join"].map((p) => ({ url: `${site.url}${p}`, changeFrequency: "monthly" }));
}
