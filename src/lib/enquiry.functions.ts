import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemSchema = z.object({
  productId: z.string().uuid().nullable(),
  code: z.string().nullable(),
  name: z.string(),
  qty: z.number().int().min(1),
  price: z.number().min(0),
});

const submitSchema = z.object({
  name: z.string().min(2).max(80),
  mobile: z.string().min(8).max(20),
  city: z.string().min(2).max(80),
  state: z.string().max(60).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  pincode: z.string().max(12).optional().nullable(),
  fulfilment: z.string().max(40).optional().nullable(),
  contactMethod: z.string().max(40).optional().nullable(),
  message: z.string().max(1000).optional().nullable(),
  freeText: z.string().max(2000).optional().nullable(),
  source: z.string().max(40).default("direct"),
  items: z.array(itemSchema).max(200).default([]),
  couponCode: z.string().max(40).optional().nullable(),
});

export const submitEnquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => submitSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const subtotal = data.items.reduce((s, i) => s + i.qty * i.price, 0);

    let discount = 0;
    let couponCode: string | null = null;
    if (data.couponCode) {
      const { couponDiscount } = await import("@/lib/coupon-math");
      const { data: coupon } = await supabaseAdmin
        .from("coupons")
        .select("*")
        .eq("code", data.couponCode.trim().toUpperCase())
        .maybeSingle();
      if (coupon) {
        const result = couponDiscount(coupon, subtotal);
        if (result.ok) {
          discount = result.discount;
          couponCode = coupon.code;
          await supabaseAdmin
            .from("coupons")
            .update({ used_count: coupon.used_count + 1 })
            .eq("id", coupon.id);
        }
      }
    }
    const estimated = Math.max(0, subtotal - discount);
    const { data: enquiry, error } = await supabaseAdmin
      .from("enquiries")
      .insert({
        name: data.name,
        mobile: data.mobile,
        city: data.city,
        state: data.state ?? null,
        address: data.address ?? null,
        pincode: data.pincode ?? null,
        fulfilment: data.fulfilment ?? null,
        contact_method: data.contactMethod ?? null,
        message: data.message ?? null,
        free_text: data.freeText ?? null,
        source: data.source,
        estimated_value: estimated,
        coupon_code: couponCode,
        discount_amount: discount,
        item_count: data.items.reduce((s, i) => s + i.qty, 0),
      })
      .select("id, ref, estimated_value, item_count")
      .single();
    if (error) throw new Error(error.message);

    if (data.items.length) {
      const { error: itemError } = await supabaseAdmin.from("enquiry_items").insert(
        data.items.map((i) => ({
          enquiry_id: enquiry.id,
          product_id: i.productId,
          product_code: i.code,
          product_name: i.name,
          qty: i.qty,
          unit_price: i.price,
        })),
      );
      if (itemError) throw new Error(itemError.message);
    }

    return {
      ref: enquiry.ref as string,
      estimated: Number(enquiry.estimated_value),
      itemCount: enquiry.item_count as number,
      discount,
      couponCode,
    };
  });

export const trackEnquiry = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ ref: z.string().min(4).max(40) }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("enquiries")
      .select("ref, name, city, status, item_count, estimated_value, created_at")
      .eq("ref", data.ref.trim().toUpperCase())
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row;
  });
