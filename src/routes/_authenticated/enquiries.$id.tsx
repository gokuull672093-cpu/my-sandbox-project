import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  FileCheck2,
  MessageCircle,
  Pencil,
  Phone,
  Printer,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABEL } from "@/lib/payments";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { PIPELINE, STATUS_LABEL, STATUS_TONE, waLink, type EnquiryStatus } from "@/lib/admin";
import { logAudit } from "@/lib/audit";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { downloadDeliverySlip } from "@/lib/delivery-slip";
import { downloadSummaryPdf } from "@/lib/enquiry-pdf";
import { inr } from "@/lib/shop";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/enquiries/$id")({
  head: () => ({
    meta: [
      { title: "Enquiry Detail — Upcurv Crackers" },
      { name: "description", content: "Call mode view for a single customer enquiry." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Enquiry Detail — Upcurv Crackers" },
      { property: "og:description", content: "Seller actions, items and internal notes." },
    ],
  }),
  component: EnquiryDetail,
});

function EnquiryDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [editing, setEditing] = useState(false);
  const [finalInput, setFinalInput] = useState("");
  const [pay, setPay] = useState({ amount: "", method: "upi", reference: "", note: "" });

  const enquiry = useQuery({
    queryKey: ["admin", "enquiry", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("enquiries")
        .select("*, enquiry_items(*), enquiry_notes(*)")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const payments = useQuery({
    queryKey: ["admin", "payments", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("enquiry_id", id)
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });


  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
  };

  // Opening the enquiry marks it as seen, which clears the sidebar alert.
  const seenAt = enquiry.data?.seen_at ?? null;
  useEffect(() => {
    if (!enquiry.data || seenAt) return;
    void supabase
      .from("enquiries")
      .update({ seen_at: new Date().toISOString() })
      .eq("id", id)
      .then(() => qc.invalidateQueries({ queryKey: ["admin"] }));
  }, [enquiry.data, seenAt, id, qc]);

  const update = useMutation({
    mutationFn: async (patch: TablesUpdate<"enquiries">) => {
      const { error } = await supabase.from("enquiries").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const addNote = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase
        .from("enquiry_notes")
        .insert({ enquiry_id: id, note: text });
      if (error) throw error;
    },
    onSuccess: () => {
      setNote("");
      invalidate();
    },
  });

  /** Every edit is logged automatically in the internal notes trail and the activity log. */
  const logEdit = (text: string, action = "update") => {
    void supabase.from("enquiry_notes").insert({
      enquiry_id: id,
      note: `[edit] ${text}`,
    });
    void logAudit({
      entity: "enquiry",
      entityId: id,
      entityLabel: enquiry.data?.ref ?? enquiry.data?.name ?? null,
      action,
      detail: text,
    });
  };

  const addPayment = useMutation({
    mutationFn: async (row: {
      amount: number;
      method: string;
      reference: string | null;
      note: string | null;
    }) => {
      const { error } = await supabase.from("payments").insert({ enquiry_id: id, ...row });
      if (error) throw error;
      logEdit(`Payment recorded: ${inr(row.amount)} via ${row.method}`);
    },
    onSuccess: () => {
      setPay({ amount: "", method: "upi", reference: "", note: "" });
      toast.success("Payment recorded");
      invalidate();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Deal Store picks, so their special price can be flagged on the item list.
  const dealProducts = useQuery({
    queryKey: ["admin", "products", "deal-picks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, deal_price")
        .not("deal_rank", "is", null);
      if (error) throw error;
      return data;
    },
  });



  const itemMutation = useMutation({
    mutationFn: async ({
      itemId,
      patch,
      log,
    }: {
      itemId: string;
      patch: TablesUpdate<"enquiry_items">;
      log?: string;
    }) => {
      const { error } = await supabase.from("enquiry_items").update(patch).eq("id", itemId);
      if (error) throw error;
      if (log) logEdit(log);
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  if (enquiry.isLoading || !enquiry.data) {
    return (
      <AdminShell>
        <div className="space-y-3">
          <Skeleton className="h-6 w-48" />
          <div className="shimmer h-40 w-full rounded-2xl" />
          <div className="shimmer h-64 w-full rounded-2xl" />
        </div>
      </AdminShell>
    );
  }

  const e = enquiry.data;
  const items = e.enquiry_items.filter((i) => !i.removed);
  const quotedValue = items.reduce((s, i) => s + i.qty * Number(i.unit_price), 0);
  const totalQty = items.reduce((s, i) => s + i.qty, 0);
  const discount = Number(e.discount_amount ?? 0);
  const delivery = Number(e.delivery_charge ?? 0);
  const payableValue = Math.max(0, quotedValue - discount) + delivery;
  const billAmount = e.final_amount != null ? Number(e.final_amount) : payableValue;
  const collected = (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
  const balance = Math.max(0, billAmount - collected);
  const paymentsDisabled = e.status === "not_converted";
  // Lines bought at a Deal Store price get a star so the lower amount is not queried.
  const dealMap = new Map((dealProducts.data ?? []).map((d) => [d.id, Number(d.deal_price ?? 0)]));
  const isDealLine = (i: { product_id: string | null; unit_price: number | string }) =>
    !!i.product_id &&
    dealMap.has(i.product_id) &&
    Number(dealMap.get(i.product_id)) === Number(i.unit_price);
  const quote = `Quotation for enquiry ${e.ref}\n${items
    .map((i) => `${i.product_name} x${i.qty} — ${inr(i.qty * Number(i.unit_price))}`)
    .join("\n")}\nTotal (indicative): ${inr(quotedValue)}\nSubject to final confirmation.`;

  const setStatus = (status: EnquiryStatus) => {
    if (status === e.status) return;
    update.mutate(
      { status },
      {
        onSuccess: () =>
          logEdit(
            `Status changed from ${STATUS_LABEL[e.status]} to ${STATUS_LABEL[status]}`,
            "status",
          ),
      },
    );
  };

  return (
    <AdminShell>
      <Link to="/enquiries" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="size-4" /> Back to pipeline
      </Link>

      <div className="mt-3 grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-semibold">{e.name}</h1>
                <p className="text-sm text-muted-foreground">
                  📞 {e.mobile} · {e.city}
                  {e.state ? `, ${e.state}` : ""}
                </p>
                {(e.address || e.pincode) && (
                  <p className="text-sm text-muted-foreground">
                    {[e.address, e.pincode].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  {e.ref} · source: {e.source} · {new Date(e.created_at).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-semibold",
                    STATUS_TONE[e.status],
                  )}
                >
                  {STATUS_LABEL[e.status]}
                </span>
                <Button
                  size="sm"
                  variant={editing ? "secondary" : "outline"}
                  onClick={() => setEditing((v) => !v)}
                >
                  {editing ? (
                    <>
                      <X className="size-4" /> Done editing
                    </>
                  ) : (
                    <>
                      <Pencil className="size-4" /> Edit
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Money summary, always visible at the top of the enquiry. */}
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-report-blue/5 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {e.final_amount != null ? "Final amount" : "Total amount"}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-report-blue">
                  {inr(billAmount)}
                </p>
                {e.final_amount != null && (
                  <p className="text-[11px] text-muted-foreground">
                    Quoted {inr(quotedValue)} · {items.length} items
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-border bg-report-green/5 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Collected
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-report-green">
                  {inr(collected)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {(payments.data ?? []).length} payment(s)
                </p>
              </div>
              <div className="rounded-xl border border-border bg-report-rose/5 p-3">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Balance due
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-report-rose">
                  {inr(balance)}
                </p>
              </div>
            </div>


            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <a href={`tel:${e.mobile}`}>
                  <Phone className="size-4" /> Call Customer
                </a>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <a href={waLink(e.mobile, `Hi ${e.name}, regarding your enquiry ${e.ref}.`)}>
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href={waLink(e.mobile, quote)}>Send Quotation</a>
              </Button>
              {e.status === "ready" && (
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => {
                    try {
                      downloadDeliverySlip({
                        ref: e.ref ?? "",
                        customer: {
                          name: e.name,
                          mobile: e.mobile,
                          city: e.city,
                          state: e.state,
                          address: e.address,
                          pincode: e.pincode,
                        },
                        lines: items.map((i) => ({ name: i.product_name, qty: i.qty })),
                        subtotal: quotedValue,
                        couponCode: e.coupon_code,
                        discount,
                        deliveryCharge: delivery,
                        total: billAmount,
                        fileName: `Delivery-Slip-${e.ref}.pdf`,
                      });
                    } catch {
                      toast.error("Could not generate the delivery slip.");
                    }
                  }}
                >
                  <Printer className="size-4" /> Delivery slip
                </Button>
              )}
            </div>

            {editing ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {PIPELINE.map((p) => (
                  <button
                    key={p.key}
                    onClick={() => setStatus(p.key)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                      e.status === p.key
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-xs text-muted-foreground">
                View only — tap Edit to change the status, quantities or follow-up.
              </p>
            )}

            {editing ? (
              <div className="mt-4 flex flex-wrap items-end gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Follow up at</label>
                  <Input
                    type="datetime-local"
                    value={followUp}
                    onChange={(ev) => setFollowUp(ev.target.value)}
                    className="mt-1 w-56"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() =>
                    update.mutate(
                      { follow_up_at: followUp ? new Date(followUp).toISOString() : null },
                      {
                        onSuccess: () =>
                          logEdit(
                            followUp
                              ? `Follow-up set to ${new Date(followUp).toLocaleString("en-IN")}`
                              : "Follow-up cleared",
                          ),
                      },
                    )
                  }
                >
                  Save follow-up
                </Button>
                {e.follow_up_at && (
                  <span className="text-xs text-muted-foreground">
                    Scheduled: {new Date(e.follow_up_at).toLocaleString("en-IN")}
                  </span>
                )}
              </div>
            ) : (
              e.follow_up_at && (
                <p className="mt-3 text-sm">
                  Follow-up scheduled:{" "}
                  <span className="font-medium">
                    {new Date(e.follow_up_at).toLocaleString("en-IN")}
                  </span>
                </p>
              )
            )}

            {(e.message || e.free_text) && (
              <div className="mt-4 rounded-xl bg-secondary/60 p-3 text-sm">
                {e.message && <p>💬 {e.message}</p>}
                {e.free_text && <p className="mt-1">📝 {e.free_text}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  Preferred: {e.fulfilment} · {e.contact_method}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">Requested products</h2>
              <span className="text-sm text-muted-foreground">
                {items.length} lines · {inr(quotedValue)} indicative
              </span>
            </div>
            <div className="mt-3 divide-y divide-border">
              {e.enquiry_items.map((i) => (
                <div
                  key={i.id}
                  className={`flex items-center gap-3 py-2 ${i.removed ? "opacity-40" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      {isDealLine(i) && (
                        <Star
                          className="size-3.5 shrink-0 fill-report-amber text-report-amber"
                          aria-label="Deal Store price"
                        />
                      )}
                      {i.product_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{i.product_code}</p>
                  </div>
                  {editing ? (
                    <Input
                      type="number"
                      min={1}
                      value={i.qty}
                      className="w-16"
                      onChange={(ev) => {
                        const qty = Math.max(1, Number(ev.target.value));
                        itemMutation.mutate({
                          itemId: i.id,
                          patch: { qty },
                          log: `${i.product_name}: quantity ${i.qty} → ${qty}`,
                        });
                      }}
                    />
                  ) : (
                    <span className="w-16 text-center text-sm tabular-nums">× {i.qty}</span>
                  )}
                  {/* Prices come from the catalogue — change them on the Products page. */}
                  <span className="w-24 text-right text-sm tabular-nums text-muted-foreground">
                    {inr(Number(i.unit_price))}
                  </span>
                  <span className="w-24 text-right text-sm font-semibold">
                    {inr(i.qty * Number(i.unit_price))}
                  </span>
                  {editing && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() =>
                        itemMutation.mutate({
                          itemId: i.id,
                          patch: { removed: !i.removed },
                          log: `${i.product_name} ${i.removed ? "restored" : "removed"}`,
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
              {e.enquiry_items.length === 0 && (
                <p className="py-4 text-sm text-muted-foreground">
                  Free-text enquiry — no catalogue items selected.
                </p>
              )}
            </div>

            {/* Bill breakdown: quantity, goods value, coupon, delivery charge, payable. */}
            <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total quantity</span>
                <span className="font-semibold tabular-nums">{totalQty} pcs</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total value ({items.length} items)</span>
                <span className="font-semibold tabular-nums">{inr(quotedValue)}</span>
              </div>
              {discount > 0 && (
                <div className="mt-1.5 flex items-center justify-between text-sm text-report-green">
                  <span>Coupon {e.coupon_code ?? ""} applied</span>
                  <span className="font-semibold tabular-nums">− {inr(discount)}</span>
                </div>
              )}
              <div className="mt-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">Delivery charge</span>
                {editing ? (
                  <Input
                    inputMode="decimal"
                    className="h-8 w-28 text-right"
                    defaultValue={delivery ? String(delivery) : ""}
                    placeholder="0"
                    onBlur={(ev) => {
                      const next = Number(ev.target.value || 0);
                      if (!Number.isFinite(next) || next < 0 || next === delivery) return;
                      update.mutate(
                        {
                          delivery_charge: next,
                          // Keep the list/payment views in sync with the new bill value.
                          estimated_value: Math.max(0, quotedValue - discount) + next,
                        },
                        {
                          onSuccess: () =>
                            logEdit(`Delivery charge ${inr(delivery)} → ${inr(next)}`),
                        },
                      );
                    }}
                  />
                ) : (
                  <span className="font-semibold tabular-nums">
                    {delivery > 0 ? `+ ${inr(delivery)}` : "Not charged"}
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-sm font-semibold">Bill value</span>
                <span className="text-xl font-semibold tabular-nums text-report-blue">
                  {inr(payableValue)}
                </span>
              </div>
            </div>

            {editing && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    update.mutate(
                      {
                        estimated_value: payableValue,
                        item_count: items.reduce((s, i) => s + i.qty, 0),
                      },
                      { onSuccess: () => logEdit(`Totals revised to ${inr(quotedValue)}`) },
                    )
                  }
                >
                  Save revised totals
                </Button>
                <Button
                  onClick={() => {
                    update.mutate(
                      {
                        status: "confirmed",
                        estimated_value: payableValue,
                        item_count: items.reduce((s, i) => s + i.qty, 0),
                      },
                      {
                        onSuccess: () => {
                          addNote.mutate(
                            `Converted to order on ${new Date().toLocaleString("en-IN")} · ${items.length} lines · ${inr(quotedValue)}`,
                          );
                          try {
                            downloadSummaryPdf({
                              title: "Order Confirmation",
                              ref: e.ref ?? "",
                              customer: { name: e.name, mobile: e.mobile, city: e.city },
                              items: items.map((i) => ({
                                name: i.product_name,
                                code: i.product_code,
                                qty: i.qty,
                                price: Number(i.unit_price),
                              })),
                              note: "Order confirmed offline with the customer. Fulfilment as agreed with the seller.",
                              fileName: `Order-${e.ref}.pdf`,
                            });
                          } catch {
                            toast.error("Order saved, but the PDF could not be generated.");
                          }
                          toast.success("Enquiry converted to order.");
                        },
                      },
                    );
                  }}
                >
                  <FileCheck2 className="size-4" /> Convert to Order
                </Button>
                <Button asChild variant="secondary">
                  <a
                    href={waLink(
                      e.mobile,
                      `Hi ${e.name}, your order ${e.ref} is confirmed.\n${items
                        .map(
                          (i) => `${i.product_name} x${i.qty} — ${inr(i.qty * Number(i.unit_price))}`,
                        )
                        .join("\n")}\nTotal: ${inr(quotedValue)}\nWe will contact you for pickup/handover.`,
                    )}
                  >
                    Send order confirmation
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Payments</h2>

            {paymentsDisabled && (
              <p className="mt-3 rounded-xl border border-dashed border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                This enquiry is marked <span className="font-medium">Not Converted</span> — no
                payment is needed.
              </p>
            )}

            {!paymentsDisabled && (
              <>
            {/* Finalize the agreed amount before collecting money. */}
            <div className="mt-3 rounded-xl border border-border p-3">
              <Label className="text-xs text-muted-foreground">Final agreed amount</Label>
              <div className="mt-1.5 flex gap-2">
                <Input
                  inputMode="decimal"
                  placeholder={String(Math.round(payableValue))}
                  value={finalInput}
                  onChange={(ev) => setFinalInput(ev.target.value)}
                />
                <Button
                  variant="secondary"
                  onClick={() => {
                    const amount = finalInput.trim() ? Number(finalInput) : payableValue;
                    if (!Number.isFinite(amount) || amount < 0) {
                      toast.error("Enter a valid amount.");
                      return;
                    }
                    update.mutate(
                      { final_amount: amount },
                      {
                        onSuccess: () => {
                          setFinalInput("");
                          toast.success("Amount finalized");
                          logEdit(`Final amount set to ${inr(amount)}`);
                        },
                      },
                    );
                  }}
                >
                  Finalize
                </Button>
              </div>
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Leave blank to finalize at the bill value {inr(payableValue)} (includes delivery and coupon).
              </p>
            </div>

            {/* Collect a full or part payment / advance. */}
            <div className="mt-3 space-y-2 rounded-xl border border-border p-3">
              <Label className="text-xs text-muted-foreground">Record a payment</Label>
              <div className="flex gap-2">
                <Input
                  inputMode="decimal"
                  placeholder={`Amount (due ${inr(balance)})`}
                  value={pay.amount}
                  onChange={(ev) => setPay({ ...pay, amount: ev.target.value })}
                />
                <Select value={pay.method} onValueChange={(v) => setPay({ ...pay, method: v })}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {PAYMENT_METHOD_LABEL[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Reference / UTR (optional)"
                value={pay.reference}
                onChange={(ev) => setPay({ ...pay, reference: ev.target.value })}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPay({ ...pay, amount: String(Math.round(balance)) })}
                >
                  Full balance
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setPay({ ...pay, amount: String(Math.round(balance / 2)) })
                  }
                >
                  Half advance
                </Button>
                <Button
                  size="sm"
                  disabled={addPayment.isPending}
                  onClick={() => {
                    const amount = Number(pay.amount);
                    if (!Number.isFinite(amount) || amount <= 0) {
                      toast.error("Enter a valid amount.");
                      return;
                    }
                    // A payment can never be larger than the amount still due.
                    if (amount > balance + 0.5) {
                      toast.error(`Amount cannot be more than the balance due (${inr(balance)}).`);
                      return;
                    }
                    addPayment.mutate({
                      amount,
                      method: pay.method,
                      reference: pay.reference.trim() || null,
                      note: pay.note.trim() || null,
                    });
                  }}
                >
                  Add payment
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Maximum you can record now: <span className="font-medium">{inr(balance)}</span>
              </p>
            </div>
              </>
            )}


            <div className="mt-3 divide-y divide-border">
              {(payments.data ?? []).map((p) => (
                <div key={p.id} className="flex items-center gap-2 py-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium tabular-nums">
                      {inr(Number(p.amount))}{" "}
                      <span className="text-xs font-normal text-muted-foreground">
                        · {PAYMENT_METHOD_LABEL[p.method] ?? p.method}
                      </span>
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(p.paid_at).toLocaleString("en-IN")}
                      {p.reference ? ` · ${p.reference}` : ""}
                    </p>
                  </div>
                </div>
              ))}
              {(payments.data ?? []).length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">
                  No payments recorded yet.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Internal notes</h2>
            <Textarea
              rows={3}
              value={note}
              placeholder="Customer wants family combo. Call after 6 PM."
              className="mt-2"
              onChange={(ev) => setNote(ev.target.value)}
            />
            <Button
              className="mt-2 w-full"
              disabled={!note.trim()}
              onClick={() => addNote.mutate(note.trim())}
            >
              Add note
            </Button>
            <div className="mt-4 space-y-2">
              {[...e.enquiry_notes]
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .map((n) => (
                  <div key={n.id} className="rounded-xl bg-secondary/60 p-3 text-sm">
                    {n.note}
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(n.created_at).toLocaleString("en-IN")}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
