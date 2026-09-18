import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, MessageCircle, Phone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { KpiCard } from "@/components/admin/kpi-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_LABEL, STATUS_TONE, waLink, type Enquiry } from "@/lib/admin";
import { inr } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-ups — Upcurv Crackers Seller Desk" },
      { name: "description", content: "Scheduled call-backs and reminders for open enquiries." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Follow-ups — Upcurv Crackers Seller Desk" },
      { property: "og:description", content: "Never miss a call-back." },
    ],
  }),
  component: FollowUps,
});

const BUCKETS = [
  { key: "overdue", label: "Overdue", tone: "rose" as const },
  { key: "today", label: "Today", tone: "blue" as const },
  { key: "upcoming", label: "Upcoming", tone: "violet" as const },
];

function FollowUps() {
  const qc = useQueryClient();
  const [reschedule, setReschedule] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "follow-ups"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*")
        .not("follow_up_at", "is", null)
        .order("follow_up_at", { ascending: true });
      if (error) throw error;
      return data as Enquiry[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, follow_up_at }: { id: string; follow_up_at: string | null }) => {
      const { error } = await supabase.from("enquiries").update({ follow_up_at }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Follow-up updated");
      qc.invalidateQueries({ queryKey: ["admin", "follow-ups"] });
      qc.invalidateQueries({ queryKey: ["admin", "enquiries"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = data ?? [];
  const todayKey = new Date().toISOString().slice(0, 10);
  const now = Date.now();

  const bucketOf = (r: Enquiry) => {
    const at = new Date(r.follow_up_at!);
    if (at.toISOString().slice(0, 10) === todayKey) return "today";
    return at.getTime() < now ? "overdue" : "upcoming";
  };

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold">Follow-ups</h1>
          <p className="text-sm text-muted-foreground">Scheduled call-backs for open enquiries</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {BUCKETS.map((b) => (
          <KpiCard
            key={b.key}
            label={b.label}
            value={String(rows.filter((r) => bucketOf(r) === b.key).length)}
            tone={b.tone}
            icon={CalendarClock}
          />
        ))}
      </div>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {BUCKETS.map((b) => {
            const items = rows.filter((r) => bucketOf(r) === b.key);
            return (
              <section key={b.key}>
                <h2 className="text-sm font-semibold">
                  {b.label}{" "}
                  <span className="text-muted-foreground">({items.length})</span>
                </h2>
                <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {items.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-xl border border-border bg-card p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          to="/enquiries/$id"
                          params={{ id: r.id }}
                          className="min-w-0 hover:underline"
                        >
                          <p className="truncate text-sm font-semibold">{r.name}</p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {r.ref} · {r.city} · {inr(Number(r.estimated_value))}
                          </p>
                        </Link>
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                            STATUS_TONE[r.status],
                          )}
                        >
                          {STATUS_LABEL[r.status]}
                        </span>
                      </div>

                      <p className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                        <CalendarClock className="size-3.5 text-muted-foreground" />
                        {new Date(r.follow_up_at!).toLocaleString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                        <a
                          href={`tel:${r.mobile}`}
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-report-blue/25 bg-report-blue/10 py-1.5 font-semibold text-report-blue"
                        >
                          <Phone className="size-3.5" /> Call
                        </a>
                        <a
                          href={waLink(r.mobile, `Hi ${r.name}, regarding your enquiry ${r.ref}`)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 rounded-lg border border-report-green/25 bg-report-green/10 py-1.5 font-semibold text-report-green"
                        >
                          <MessageCircle className="size-3.5" /> WhatsApp
                        </a>
                      </div>

                      <div className="mt-3 flex items-center gap-2">
                        <Input
                          type="datetime-local"
                          className="h-8 text-xs"
                          value={reschedule[r.id] ?? ""}
                          onChange={(e) =>
                            setReschedule({ ...reschedule, [r.id]: e.target.value })
                          }
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!reschedule[r.id]}
                          onClick={() =>
                            update.mutate({
                              id: r.id,
                              follow_up_at: new Date(reschedule[r.id]!).toISOString(),
                            })
                          }
                        >
                          Move
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => update.mutate({ id: r.id, follow_up_at: null })}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 && (
                    <p className="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground sm:col-span-2 xl:col-span-3">
                      Nothing here.
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
