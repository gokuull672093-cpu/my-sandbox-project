import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BellRing,
  CheckCircle2,
  IndianRupee,
  ListChecks,
  PhoneCall,
  PlusCircle,
  XCircle,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AdminShell } from "@/components/admin-shell";
import { KpiCard } from "@/components/admin/kpi-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { PIPELINE, STATUS_LABEL, STATUS_TONE, type Enquiry } from "@/lib/admin";
import { inr } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Seller Dashboard — Upcurv Crackers" },
      { name: "description", content: "Today's enquiry overview for the shop team." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Seller Dashboard — Upcurv Crackers" },
      { property: "og:description", content: "Enquiry overview and follow-ups." },
    ],
  }),
  component: Dashboard,
});

const PALETTE = [
  "var(--report-blue)",
  "var(--report-teal)",
  "var(--report-green)",
  "var(--report-violet)",
  "var(--report-rose)",
];

function Dashboard() {
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

  const rows = data ?? [];
  const countBy = (s: string) => rows.filter((r) => r.status === s).length;
  const value = rows.reduce((s, r) => s + Number(r.estimated_value), 0);
  const followUps = rows.filter((r) => r.follow_up_at);
  const today = new Date().toISOString().slice(0, 10);
  const todayRows = rows.filter((r) => r.created_at.slice(0, 10) === today);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const yRows = rows.filter((r) => r.created_at.slice(0, 10) === yesterday);
  const pct = (a: number, b: number) => (b === 0 ? (a > 0 ? 100 : 0) : ((a - b) / b) * 100);

  const trend = (() => {
    const map = new Map<string, { day: string; enquiries: number; value: number }>();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      map.set(d, { day: d.slice(5), enquiries: 0, value: 0 });
    }
    for (const r of rows) {
      const row = map.get(r.created_at.slice(0, 10));
      if (!row) continue;
      row.enquiries += 1;
      row.value += Number(r.estimated_value);
    }
    return [...map.values()];
  })();

  const statusPie = PIPELINE.map((p) => ({ name: p.label, value: countBy(p.key) })).filter(
    (s) => s.value > 0,
  );

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-xl font-semibold">Today&apos;s overview</h1>
          <p className="text-sm text-muted-foreground">
            {todayRows.length} new enquiries today · {followUps.length} follow-ups pending
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/follow-ups">
              <BellRing className="size-4" /> Follow-ups
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/new-enquiry">
              <PlusCircle className="size-4" /> New enquiry
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="New enquiries"
            value={String(countBy("new"))}
            tone="blue"
            icon={ListChecks}
            delta={pct(todayRows.length, yRows.length)}
            hint="today vs yesterday"
          />
          <KpiCard
            label="Pending calls"
            value={String(countBy("new") + countBy("contact_required"))}
            hint="New + contact required"
            tone="rose"
            icon={PhoneCall}
          />
          <KpiCard
            label="Confirmed"
            value={String(countBy("confirmed"))}
            tone="green"
            icon={CheckCircle2}
          />
          <KpiCard
            label="Follow-ups"
            value={String(followUps.length)}
            tone="violet"
            icon={BellRing}
          />
          <KpiCard
            label="Not converted"
            value={String(countBy("not_converted"))}
            tone="teal"
            icon={XCircle}
          />
          <KpiCard
            label="Enquiry value"
            value={inr(value)}
            tone="green"
            icon={IndianRupee}
            hint="all time"
          />
        </div>
      )}

      <div className="mt-4 grid min-w-0 gap-4 xl:grid-cols-3">
        <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm xl:col-span-2">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Last 14 days</h2>
            <p className="text-[11px] text-muted-foreground">Enquiries received per day</p>
          </header>
          <div className="h-64 w-full min-w-0 p-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="dash-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--report-blue)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--report-blue)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  width={40}
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <RTooltip
                  contentStyle={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="enquiries"
                  name="Enquiries"
                  stroke="var(--report-blue)"
                  strokeWidth={2}
                  fill="url(#dash-grad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Pipeline</h2>
            <p className="text-[11px] text-muted-foreground">Share of enquiries by stage</p>
          </header>
          <div className="h-52 w-full min-w-0 p-3">
            {statusPie.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No enquiries yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusPie}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="52%"
                    outerRadius="80%"
                    paddingAngle={2}
                  >
                    {statusPie.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="var(--card)" />
                    ))}
                  </Pie>
                  <RTooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="divide-y divide-border border-t border-border text-sm">
            {PIPELINE.map((p) => (
              <li key={p.key} className="flex items-center justify-between px-4 py-1.5">
                <span className="text-muted-foreground">{p.label}</span>
                <span className="font-semibold tabular-nums">{countBy(p.key)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm xl:col-span-2">
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Latest enquiries</h2>
          </header>
          <div className="divide-y divide-border">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2 p-4">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))
              : rows.slice(0, 5).map((r) => (
                  <Link
                    key={r.id}
                    to="/enquiries/$id"
                    params={{ id: r.id }}
                    className="block p-3.5 hover:bg-accent/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold">{r.name}</span>
                      <span
                        className={cn(
                          "shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                          STATUS_TONE[r.status],
                        )}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.ref} · {r.city} · {r.item_count} items ·{" "}
                      {inr(Number(r.estimated_value))} · {r.source}
                    </p>
                  </Link>
                ))}
            {!isLoading && rows.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">No enquiries yet.</p>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold">Upcoming follow-ups</h2>
            <Link to="/follow-ups" className="text-[11px] font-semibold text-report-blue">
              View all
            </Link>
          </header>
          <div className="divide-y divide-border">
            {followUps.length === 0 && (
              <p className="p-6 text-sm text-muted-foreground">No follow-ups scheduled.</p>
            )}
            {followUps.slice(0, 8).map((f) => (
              <Link
                key={f.id}
                to="/enquiries/$id"
                params={{ id: f.id }}
                className="block p-3.5 text-sm hover:bg-accent/40"
              >
                <span className="font-medium">
                  {new Date(f.follow_up_at!).toLocaleString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <p className="text-xs text-muted-foreground">
                  {f.name} · {f.mobile}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
