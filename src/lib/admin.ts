import type { Enums, Tables } from "@/integrations/supabase/types";

export type EnquiryStatus = Enums<"enquiry_status">;
export type Enquiry = Tables<"enquiries">;

export const PIPELINE: { key: EnquiryStatus; label: string; hint: string }[] = [
  { key: "new", label: "New", hint: "Customer submitted enquiry" },
  { key: "contact_required", label: "Contact Required", hint: "Seller needs to call" },
  { key: "contacted", label: "Contacted", hint: "Customer reached" },
  { key: "discussion", label: "Discussion", hint: "Availability/pricing discussed" },
  { key: "confirmed", label: "Confirmed", hint: "Confirmed offline" },
  { key: "ready", label: "Ready", hint: "Order prepared" },
  { key: "completed", label: "Completed", hint: "Picked up / received" },
  { key: "not_converted", label: "Not Converted", hint: "Customer didn't proceed" },
];

export const STATUS_LABEL = Object.fromEntries(PIPELINE.map((p) => [p.key, p.label])) as Record<
  EnquiryStatus,
  string
>;

export const SOURCES = [
  "whatsapp",
  "instagram",
  "facebook",
  "google",
  "qr",
  "direct",
  "referral",
  "walk_in",
  "phone",
];

/** Badge classes per pipeline status (semantic report tokens, no hardcoded colors). */
export const STATUS_TONE: Record<EnquiryStatus, string> = {
  new: "bg-report-blue/10 text-report-blue border-report-blue/25",
  contact_required: "bg-report-rose/10 text-report-rose border-report-rose/25",
  contacted: "bg-report-violet/10 text-report-violet border-report-violet/25",
  discussion: "bg-report-teal/10 text-report-teal border-report-teal/25",
  confirmed: "bg-report-green/10 text-report-green border-report-green/25",
  ready: "bg-report-teal/15 text-report-teal border-report-teal/30",
  completed: "bg-report-green/15 text-report-green border-report-green/35",
  not_converted: "bg-muted text-muted-foreground border-border",
};

export const STATUS_DOT: Record<EnquiryStatus, string> = {
  new: "bg-report-blue",
  contact_required: "bg-report-rose",
  contacted: "bg-report-violet",
  discussion: "bg-report-teal",
  confirmed: "bg-report-green",
  ready: "bg-report-teal",
  completed: "bg-report-green",
  not_converted: "bg-muted-foreground",
};

export function waLink(mobile: string, text: string) {
  const digits = mobile.replace(/\D/g, "");
  const withCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCode}?text=${encodeURIComponent(text)}`;
}
