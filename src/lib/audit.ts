import { supabase } from "@/integrations/supabase/client";

export type AuditInput = {
  entity: string;
  entityId?: string | null;
  entityLabel?: string | null;
  action: string;
  field?: string | null;
  oldValue?: string | number | null;
  newValue?: string | number | null;
  detail?: string | null;
};

const str = (v: string | number | null | undefined) =>
  v === null || v === undefined ? null : String(v);

/** Records an admin action in the activity log. Best-effort: never blocks the UI. */
export async function logAudit(entry: AuditInput) {
  try {
    const { data } = await supabase.auth.getUser();
    await supabase.from("audit_logs").insert({
      entity: entry.entity,
      entity_id: entry.entityId ?? null,
      entity_label: entry.entityLabel ?? null,
      action: entry.action,
      field: entry.field ?? null,
      old_value: str(entry.oldValue),
      new_value: str(entry.newValue),
      detail: entry.detail ?? null,
      actor: data.user?.email ?? "admin",
    });
  } catch {
    /* logging must never break the action it describes */
  }
}

export const AUDIT_ACTION_TONE: Record<string, string> = {
  create: "bg-report-green/10 text-report-green border-report-green/25",
  update: "bg-report-blue/10 text-report-blue border-report-blue/25",
  status: "bg-report-violet/10 text-report-violet border-report-violet/25",
  payment: "bg-report-teal/10 text-report-teal border-report-teal/25",
  delete: "bg-report-rose/10 text-report-rose border-report-rose/25",
};

export const AUDIT_ENTITIES = [
  "enquiry",
  "payment",
  "product",
  "category",
  "combo",
  "coupon",
  "deal",
  "settings",
] as const;
