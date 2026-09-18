import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OrderSettings = { min_order_value: number };
export type SiteVisualSettings = { hero_image_url: string };

export const ORDER_SETTINGS_KEY = "order";
export const SITE_VISUALS_KEY = "site_visuals";

export const orderSettingsQuery = queryOptions({
  queryKey: ["settings", ORDER_SETTINGS_KEY],
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<OrderSettings> => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", ORDER_SETTINGS_KEY)
      .maybeSingle();
    if (error) throw error;
    const value = (data?.value ?? {}) as Partial<OrderSettings>;
    return { min_order_value: Number(value.min_order_value ?? 0) };
  },
});

export const siteVisualsQuery = queryOptions({
  queryKey: ["settings", SITE_VISUALS_KEY],
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<SiteVisualSettings> => {
    const { data, error } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", SITE_VISUALS_KEY)
      .maybeSingle();
    if (error) throw error;
    const value = (data?.value ?? {}) as Partial<SiteVisualSettings>;
    return { hero_image_url: String(value.hero_image_url ?? "") };
  },
});
