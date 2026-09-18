import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { AUDIT_ACTION_TONE } from "@/lib/audit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/audit-logs")({
  head: () => ({
    meta: [
      { title: "Activity Log — Upcurv Crackers Seller Desk" },
      { name: "description", content: "Every change made in the seller desk, with time and detail." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Activity Log — Upcurv Crackers Seller Desk" },
      { property: "og:description", content: "Audit trail of admin changes." },
    ],
  }),
  component: AuditLogsPage,
});

const FILTERS = ["all", "enquiry", "payment", "product", "category", "combo", "coupon", "settings"];

function AuditLogsPage() {
  const [entity, setEntity] = useState("all");
  const [term, setTerm] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const rows = (data ?? [])
    .filter((r) => entity === "all" || r.entity === entity)
    .filter((r) => {
      const q = term.trim().toLowerCase();
      if (!q) return true;
      return [r.entity, r.entity_label, r.action, r.detail, r.actor, r.field]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold">Activity log</h1>
          <p className="text-sm text-muted-foreground">
            Every change made in the seller desk — status moves, payments, catalogue edits.
          </p>
        </div>
        <Input
          placeholder="Search log…"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          className="ml-auto w-full max-w-xs"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Button
            key={f}
            size="sm"
            variant={entity === f ? "default" : "outline"}
            className="capitalize"
            onClick={() => setEntity(f)}
          >
            {f}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center">
          <History className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">No activity recorded yet.</p>
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize",
                    AUDIT_ACTION_TONE[r.action] ?? "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {r.action}
                </span>
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground">
                  {r.entity}
                </span>
                <span className="ml-auto text-[11px] tabular-nums text-muted-foreground">
                  {new Date(r.created_at).toLocaleString("en-IN")}
                </span>
              </div>

              {r.entity_label && (
                <p className="mt-2 truncate text-sm font-semibold">{r.entity_label}</p>
              )}
              {r.detail && <p className="mt-1 text-sm text-foreground/80">{r.detail}</p>}

              {(r.field || r.old_value || r.new_value) && (
                <div className="mt-2 rounded-lg bg-muted/60 p-2 text-xs">
                  {r.field && <p className="font-medium capitalize">{r.field}</p>}
                  <p className="text-muted-foreground">
                    {r.old_value !== null && (
                      <span className="line-through">{r.old_value}</span>
                    )}
                    {r.old_value !== null && r.new_value !== null && " → "}
                    {r.new_value !== null && (
                      <span className="font-semibold text-foreground">{r.new_value}</span>
                    )}
                  </p>
                </div>
              )}

              <p className="mt-2 text-[11px] text-muted-foreground">
                By {r.actor ?? "admin"} ·{" "}
                {new Date(r.created_at).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </article>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
