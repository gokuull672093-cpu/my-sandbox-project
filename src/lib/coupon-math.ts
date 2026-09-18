import type { Tables } from "@/integrations/supabase/types";

export type Coupon = Tables<"coupons">;

/** Shared coupon maths — used on the enquiry page and re-checked on the server. */
export function couponDiscount(coupon: Coupon, subtotal: number) {
  if (!coupon.active)
    return { ok: false as const, reason: "This coupon is no longer active.", discount: 0 };
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() < Date.now())
    return { ok: false as const, reason: "This coupon has expired.", discount: 0 };
  if (subtotal < Number(coupon.min_value))
    return {
      ok: false as const,
      reason: `Add items worth ₹${Math.ceil(Number(coupon.min_value) - subtotal)} more to use this coupon.`,
      discount: 0,
    };
  let discount =
    coupon.discount_type === "flat"
      ? Number(coupon.value)
      : (subtotal * Number(coupon.value)) / 100;
  if (coupon.max_discount != null) discount = Math.min(discount, Number(coupon.max_discount));
  discount = Math.min(Math.round(discount), subtotal);
  return { ok: true as const, reason: "", discount };
}
