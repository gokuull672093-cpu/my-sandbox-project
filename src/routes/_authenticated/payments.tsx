import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { BadgeIndianRupee, Clock, Receipt, Wallet } from "lucide-react";
import { useMemo } from "react";

import { AdminShell } from "@/components/admin-shell";
import { KpiCard } from "@/components/admin/kpi-card";
import { supabase } from "@/integrations/supabase/client";
import { PAYMENT_METHOD_LABEL, PAYMENT_METHOD_TONE } from "@/lib/payments";
import { inr } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Upcurv Crackers Seller Desk" },
      { name: "description", content: "Collected, pending and recent payment records." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Payments — Upcurv Crackers Seller Desk" },
      { property: "og:description", content: "Track collections and outstanding balances." },
    ],
  }),
  component: PaymentsPage,
});

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function PaymentsPage() {
  const payments = useQuery({
    queryKey: ["admin", "payments", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, enquiries(id, ref, name, mobile, city, status, estimated_value, final_amount)")
        .order("paid_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const enquiries = useQuery({
    queryKey: ["admin", "enquiries", "payments"],
    queryFn: async () => {
      // Any enquiry can carry a balance once the amount is finalized or a part
      // payment is taken — not just confirmed ones. Only "not converted" is out.
      const { data, error } = await supabase
        .from("enquiries")
        .select("id, ref, name, mobile, city, status, estimated_value, final_amount")
        .neq("status", "not_converted");
      if (error) throw error;
      return data;
    },
  });

  const stats = useMemo(() => {
    const rows = payments.data ?? [];
    const collected = rows.reduce((s, p) => s + Number(p.amount), 0);
    const today = startOfToday().getTime();
    const todayCollected = rows
      .filter((p) => new Date(p.paid_at).getTime() >= today)
      .reduce((s, p) => s + Number(p.amount), 0);

    const paidByEnquiry = new Map<string, number>();
    for (const p of rows) {
      paidByEnquiry.set(p.enquiry_id, (paidByEnquiry.get(p.enquiry_id) ?? 0) + Number(p.amount));
    }

    const billed = (enquiries.data ?? [])
      .map((e) => {
        const bill = e.final_amount != null ? Number(e.final_amount) : Number(e.estimated_value);
        const paid = paidByEnquiry.get(e.id) ?? 0;
        return { e, bill, paid, due: Math.max(0, bill - paid) };
      })
      // Show a balance once money is expected: amount finalized, a payment
      // already taken, or the order is confirmed / ready / completed.
      .filter(
        (b) =>
          b.paid > 0 ||
          b.e.final_amount != null ||
          ["confirmed", "ready", "completed"].includes(b.e.status),
      );
    const pending = billed.reduce((s, b) => s + b.due, 0);

    return {
      collected,
      todayCollected,
      pending,
      count: rows.length,
      outstanding: billed.filter((b) => b.due > 0).sort((a, b) => b.due - a.due),
    };
  }, [payments.data, enquiries.data]);

  if (payments.isLoading) {
    return (
      <AdminShell>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-28 rounded-xl" />
          ))}
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <h1 className="text-xl font-semibold">Payments</h1>
      <p className="text-sm text-muted-foreground">
        Every collection recorded on an enquiry shows up here automatically.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Collected"
          value={inr(stats.collected)}
          hint="All time"
          tone="green"
          icon={Wallet}
        />
        <KpiCard
          label="Pending"
          value={inr(stats.pending)}
          hint="Across confirmed orders"
          tone="rose"
          icon={Clock}
        />
        <KpiCard
          label="Collected today"
          value={inr(stats.todayCollected)}
          tone="blue"
          icon={BadgeIndianRupee}
        />
        <KpiCard
          label="Payment entries"
          value={String(stats.count)}
          tone="violet"
          icon={Receipt}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card p-4 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold">Recent payments</h2>
          <div className="mt-2 divide-y divide-border">
            {(payments.data ?? []).map((p) => (
              <div key={p.id} className="flex items-center gap-3 py-2.5 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {p.enquiries?.name ?? "—"}{" "}
                    <span className="text-xs text-muted-foreground">{p.enquiries?.ref}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(p.paid_at).toLocaleString("en-IN")}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </p>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                    PAYMENT_METHOD_TONE[p.method] ?? PAYMENT_METHOD_TONE["other"],
                  )}
                >
                  {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
                </span>
                <span className="w-24 text-right font-semibold tabular-nums">
                  {inr(Number(p.amount))}
                </span>
                {p.enquiries?.id && (
                  <Link
                    to="/enquiries/$id"
                    params={{ id: p.enquiries.id }}
                    className="text-xs text-report-blue"
                  >
                    Open
                  </Link>
                )}
              </div>
            ))}
            {(payments.data ?? []).length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No payments recorded yet.
              </p>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <h2 className="text-sm font-semibold">Outstanding balances</h2>
          <div className="mt-2 divide-y divide-border">
            {stats.outstanding.map((b) => (
              <Link
                key={b.e.id}
                to="/enquiries/$id"
                params={{ id: b.e.id }}
                className="flex items-center gap-3 py-2.5 text-sm hover:bg-accent/40"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{b.e.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {b.e.ref} · paid {inr(b.paid)} of {inr(b.bill)}
                  </p>
                </div>
                <span className="font-semibold tabular-nums text-report-rose">{inr(b.due)}</span>
              </Link>
            ))}
            {stats.outstanding.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Nothing pending — all confirmed orders are settled.
              </p>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
