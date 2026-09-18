import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, MessageCircle, Phone, Columns3 } from "lucide-react";
import { useState } from "react";

import { AdminShell } from "@/components/admin-shell";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { PIPELINE, STATUS_LABEL, STATUS_TONE, waLink, type Enquiry } from "@/lib/admin";
import { inr } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/enquiries/")({
  head: () => ({
    meta: [
      { title: "Enquiry Pipeline — Upcurv Crackers" },
      { name: "description", content: "Kanban pipeline of customer enquiries for the shop team." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Enquiry Pipeline — Upcurv Crackers" },
      { property: "og:description", content: "Track every enquiry from new to completed." },
    ],
  }),
  component: Pipeline,
});

/** Card amount follows the finalized bill when there is one. */
function billOf(r: Enquiry) {
  return r.final_amount != null ? Number(r.final_amount) : Number(r.estimated_value);
}

function StatusBadge({ status }: { status: Enquiry["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        STATUS_TONE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function ContactButtons({ r }: { r: Enquiry }) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
      <a
        href={`tel:${r.mobile}`}
        className="flex items-center justify-center gap-1.5 rounded-lg border border-report-blue/25 bg-report-blue/10 py-1.5 font-semibold text-report-blue transition-colors hover:bg-report-blue/20"
      >
        <Phone className="size-3.5" /> Call
      </a>
      <a
        href={waLink(r.mobile, `Hi ${r.name}, regarding your enquiry ${r.ref}`)}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-1.5 rounded-lg border border-report-green/25 bg-report-green/10 py-1.5 font-semibold text-report-green transition-colors hover:bg-report-green/20"
      >
        <MessageCircle className="size-3.5" /> WhatsApp
      </a>
    </div>
  );
}

function Pipeline() {
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "board">("grid");
  const [status, setStatus] = useState<"all" | Enquiry["status"]>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "enquiries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Enquiry[];
    },
  });

  const CLOSED: Enquiry["status"][] = ["completed", "not_converted"];
  const rows = (data ?? [])
    .filter((r) =>
      q
        ? `${r.name} ${r.mobile} ${r.ref ?? ""} ${r.city}`.toLowerCase().includes(q.toLowerCase())
        : true,
    )
    // Completed and not-converted enquiries always sink to the bottom of every list.
    .sort((a, b) => Number(CLOSED.includes(a.status)) - Number(CLOSED.includes(b.status)));
  const gridRows = status === "all" ? rows : rows.filter((r) => r.status === status);

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold">Enquiries</h1>
          <p className="text-sm text-muted-foreground">{rows.length} enquiries</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, mobile or enquiry ID"
            className="w-56"
          />
          <div className="flex rounded-lg border border-border bg-card p-0.5">
            {(
              [
                { key: "grid", icon: LayoutGrid, label: "Grid" },
                { key: "board", icon: Columns3, label: "Board" },
              ] as const
            ).map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                aria-label={v.label}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium",
                  view === v.key
                    ? "bg-report-blue/10 text-report-blue"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <v.icon className="size-4" /> {v.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === "grid" ? (
        <>
          <div className="mt-4 flex flex-wrap gap-1.5">
            <button
              onClick={() => setStatus("all")}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold",
                status === "all"
                  ? "border-foreground/20 bg-foreground text-background"
                  : "border-border text-muted-foreground",
              )}
            >
              All {rows.length}
            </button>
            {PIPELINE.map((p) => {
              const count = rows.filter((r) => r.status === p.key).length;
              return (
                <button
                  key={p.key}
                  onClick={() => setStatus(p.key)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold",
                    status === p.key ? STATUS_TONE[p.key] : "border-border text-muted-foreground",
                  )}
                >
                  {p.label} {count}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-xl" />
              ))}
            {gridRows.map((r) => (
              <div
                key={r.id}
                className={cn(
                  "rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md",
                  r.seen_at
                    ? "border-border"
                    : "border-report-rose/40 bg-report-rose/5 ring-1 ring-report-rose/20",
                )}
              >
                <Link to="/enquiries/$id" params={{ id: r.id }} className="block">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                        {!r.seen_at && (
                          <span className="size-2 shrink-0 rounded-full bg-report-rose" />
                        )}
                        {r.name}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {r.ref} · {r.city}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <span className="text-lg font-semibold">{inr(billOf(r))}</span>
                    <span className="text-[11px] text-muted-foreground">{r.item_count} items</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {r.mobile} · {r.source} ·{" "}
                    {new Date(r.created_at).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </p>
                </Link>
                <ContactButtons r={r} />
              </div>
            ))}
            {!isLoading && gridRows.length === 0 && (
              <p className="col-span-full rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
                No enquiries here.
              </p>
            )}
          </div>
        </>
      ) : (
        <div className="-mx-4 mt-5 flex gap-3 overflow-x-auto px-4 pb-4">
          {PIPELINE.map((col) => {
            const items = rows.filter((r) => r.status === col.key);
            return (
              <div key={col.key} className="w-72 shrink-0">
                <div className="flex items-baseline justify-between px-1">
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <p className="px-1 text-[11px] text-muted-foreground">{col.hint}</p>
                <div className="mt-2 space-y-2">
                  {isLoading &&
                    Array.from({ length: 2 }).map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                  {items.map((r) => (
                    <div
                      key={r.id}
                      className={cn(
                        "rounded-xl border bg-card p-3",
                        r.seen_at ? "border-border" : "border-report-rose/40 bg-report-rose/5",
                      )}
                    >
                      <Link to="/enquiries/$id" params={{ id: r.id }} className="block">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-semibold">{r.name}</p>
                          <StatusBadge status={r.status} />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {r.ref} · {r.city}
                        </p>
                        <p className="mt-1 text-xs">
                          {r.item_count} items · {inr(billOf(r))}
                        </p>
                      </Link>
                      <ContactButtons r={r} />
                    </div>
                  ))}
                  {!isLoading && items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Empty
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
