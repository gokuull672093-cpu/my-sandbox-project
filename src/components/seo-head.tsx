import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { seoSettingsQuery } from "@/lib/seo-settings";

function setMeta(attr: "name" | "property", key: string, content: string) {
  if (!content) return;
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

/**
 * Applies the search-engine details the seller saved on the hidden SEO page
 * to the live pages (title, description, keywords, share image, favicon).
 */
export function SeoHead() {
  const { data } = useQuery(seoSettingsQuery);

  useEffect(() => {
    if (!data) return;
    if (data.site_title) {
      document.title = data.site_title;
      setMeta("property", "og:title", data.site_title);
      setMeta("name", "twitter:title", data.site_title);
    }
    setMeta("name", "description", data.description);
    setMeta("property", "og:description", data.description);
    setMeta("name", "twitter:description", data.description);
    setMeta("name", "keywords", data.keywords);
    setMeta("property", "og:image", data.og_image);
    setMeta("name", "twitter:image", data.og_image);
    if (data.twitter_handle) setMeta("name", "twitter:site", data.twitter_handle);

    if (data.favicon_url) {
      let icon = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!icon) {
        icon = document.createElement("link");
        icon.rel = "icon";
        document.head.appendChild(icon);
      }
      icon.href = data.favicon_url;
    }
  }, [data]);

  return null;
}
