import { supabase } from "@/integrations/supabase/client";
import { readSource } from "@/lib/enquiry-cart";

const SESSION_KEY = "upcurv-session-id";

function sessionId() {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export type EventKind =
  | "page_view"
  | "add_to_cart"
  | "enquiry_start"
  | "enquiry_submit"
  /** Added from the Deal Store strip on the enquiry page only. */
  | "deal_add"
  /** Added from the Popular add-ons strip on the enquiry page only. */
  | "addon_add";

/** Fire-and-forget activity logging used by the seller reports page. */
export function track(
  kind: EventKind,
  extra: {
    productId?: string | null;
    productName?: string | null;
    qty?: number;
    value?: number;
  } = {},
) {
  if (typeof window === "undefined") return;
  void supabase
    .from("site_events")
    .insert({
      kind,
      session_id: sessionId(),
      path: window.location.pathname,
      product_id: extra.productId ?? null,
      product_name: extra.productName ?? null,
      qty: extra.qty ?? 0,
      value: extra.value ?? 0,
      source: readSource(),
    })
    .then(
      () => undefined,
      () => undefined,
    );
}
