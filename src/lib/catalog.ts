import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Product = Tables<"products">;
export type Category = Tables<"categories">;
export type Combo = Tables<"combos">;

export const categoryImage = (slug: string | null | undefined) => {
  switch (slug) {
    case "sparklers":
    case "flower-pots":
    case "kids":
      return sparklers.url;
    case "gift-boxes":
    case "fancy":
      return gift.url;
    default:
      return ground.url;
  }
};

export const AVAILABILITY_LABEL: Record<string, string> = {
  available: "Available",
  limited: "Limited",
  unavailable: "Unavailable",
  enquiry_only: "Ask availability",
};

export const EXPERIENCES = [
  { key: "sky", label: "Sky & Aerial", labelTa: "வானவேடிக்கை", emoji: "🎆" },
  { key: "sparkle", label: "Sparkle & Light", labelTa: "மின்னும் ஒளி", emoji: "✨" },
  { key: "colourful", label: "Colourful", labelTa: "வண்ணமயம்", emoji: "🌈" },
  { key: "traditional", label: "Traditional", labelTa: "பாரம்பரியம்", emoji: "🪔" },
  { key: "gift", label: "Gift Packs", labelTa: "பரிசு பெட்டி", emoji: "🎁" },
  { key: "family", label: "Family Collections", labelTa: "குடும்ப தொகுப்பு", emoji: "👨‍👩‍👧" },
];

export const BOX_TAGS = [
  { key: "family", label: "Family" },
  { key: "kids", label: "Children friendly" },
  { key: "colourful", label: "Colourful" },
  { key: "variety", label: "Variety" },
  { key: "premium", label: "Premium" },
  { key: "traditional", label: "Traditional" },
];

/** Short marketing badges shown on product cards to nudge the customer. */
export const PROMO_TAGS = [
  { key: "bestseller", label: "Bestseller", emoji: "\u2b50" },
  { key: "new", label: "New arrival", emoji: "\u2728" },
  { key: "kids_safe", label: "Kids safe", emoji: "\ud83e\uddd2" },
  { key: "value", label: "Best value", emoji: "\ud83d\udcb0" },
  { key: "trending", label: "Trending now", emoji: "\ud83d\udd25" },
  { key: "fast_moving", label: "Fast moving", emoji: "\u26a1" },
  { key: "family_pick", label: "Family pick", emoji: "\ud83c\udfe0" },
  { key: "limited_offer", label: "Limited offer", emoji: "\ud83c\udff7\ufe0f" },
  { key: "premium_choice", label: "Premium choice", emoji: "\ud83d\udc8e" },
  { key: "festival_fav", label: "Festival favourite", emoji: "\ud83e\ude94" },
] as const;

export const PROMO_TAG_LABEL: Record<string, string> = Object.fromEntries(
  PROMO_TAGS.map((t) => [t.key, `${t.emoji} ${t.label}`]),
);

export const categoriesQuery = queryOptions({
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort");
    if (error) throw error;
    return data;
  },
});

export const productsQuery = queryOptions({
  queryKey: ["products"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .order("code");
    if (error) throw error;
    return data;
  },
});

export const popularProductsQuery = queryOptions({
  queryKey: ["products", "popular"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("active", true)
      .not("popular_rank", "is", null)
      .order("popular_rank", { ascending: true })
      .order("code");
    if (error) throw error;
    return data;
  },
});

export const combosQuery = queryOptions({
  queryKey: ["combos"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("combos")
      .select("*, combo_items(qty, products(*))")
      .eq("active", true)
      .order("indicative_price");
    if (error) throw error;
    return data;
  },
});

/** Seller-configured budget selection: greedy fill from tagged products. */
export function buildBox(products: Product[], budget: number, tags: string[]) {
  const pool = products.filter(
    (p) =>
      p.availability !== "unavailable" &&
      (tags.length === 0 || tags.some((t) => p.tags.includes(t))),
  );
  const sorted = [...pool].sort((a, b) => Number(b.price) - Number(a.price));
  const picked: { product: Product; qty: number }[] = [];
  let spent = 0;
  // one of each affordable item first (variety), then top up the cheapest ones
  for (const p of sorted) {
    const price = Number(p.price);
    if (spent + price <= budget) {
      picked.push({ product: p, qty: 1 });
      spent += price;
    }
  }
  let guard = 0;
  while (guard++ < 200 && picked.length) {
    const cheapest = picked.reduce((a, b) =>
      Number(a.product.price) <= Number(b.product.price) ? a : b,
    );
    const price = Number(cheapest.product.price);
    if (price <= 0 || spent + price > budget) break;
    cheapest.qty += 1;
    spent += price;
  }
  return { picked, spent };
}

export type { Coupon } from "@/lib/coupon-math";
export { couponDiscount } from "@/lib/coupon-math";

export const couponsQuery = queryOptions({
  queryKey: ["coupons"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("active", true)
      .order("created_at");
    if (error) throw error;
    return data;
  },
});
