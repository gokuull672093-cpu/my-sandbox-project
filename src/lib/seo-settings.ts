import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SeoSettings = {
  site_title: string;
  description: string;
  keywords: string;
  og_image: string;
  favicon_url: string;
  base_url: string;
  twitter_handle: string;
};

export const SEO_SETTINGS_KEY = "seo";

export const EMPTY_SEO: SeoSettings = {
  site_title: "",
  description: "",
  keywords: "",
  og_image: "",
  favicon_url: "",
  base_url: "",
  twitter_handle: "",
};

export const seoSettingsQuery = queryOptions({
  queryKey: ["settings", SEO_SETTINGS_KEY],
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<SeoSettings> => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SEO_SETTINGS_KEY)
      .maybeSingle();
    if (error) throw error;
    const v = (data?.value ?? {}) as Partial<SeoSettings>;
    return { ...EMPTY_SEO, ...v };
  },
});

/** Public pages that belong in the sitemap. */
export const PUBLIC_PATHS = ["/", "/catalogue", "/combos", "/build-box", "/enquiry"];

export function buildRobotsTxt(base: string) {
  const lines = ["User-agent: *", "Allow: /", "Disallow: /dashboard", "Disallow: /auth"];
  if (base.trim()) lines.push(`Sitemap: ${base.replace(/\/$/, "")}/sitemap.xml`);
  return lines.join("\n") + "\n";
}

export function buildSitemapXml(base: string) {
  const root = base.trim().replace(/\/$/, "");
  const today = new Date().toISOString().slice(0, 10);
  const urls = PUBLIC_PATHS.map(
    (p) =>
      `  <url>\n    <loc>${root}${p === "/" ? "/" : p}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n  </url>`,
  ).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
