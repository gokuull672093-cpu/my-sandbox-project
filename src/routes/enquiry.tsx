import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Download, MessageCircle, Minus, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { LegalNotice, SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { citiesFor, STATES, TAMIL_NADU } from "@/lib/india-locations";
import { orderSettingsQuery } from "@/lib/settings";
import { couponDiscount, couponsQuery, productsQuery } from "@/lib/catalog";
import { track } from "@/lib/analytics";
import { readSource, useCart } from "@/lib/enquiry-cart";
import { submitEnquiry } from "@/lib/enquiry.functions";
import { downloadSummaryPdf } from "@/lib/enquiry-pdf";
import { pick, useLang } from "@/lib/i18n";
import { inr, SHOP } from "@/lib/shop";

export const Route = createFileRoute("/enquiry")({
  head: () => ({
    meta: [
      { title: "My Diwali Enquiry — Upcurv Crackers" },
      {
        name: "description",
        content:
          "Review your selected crackers, see savings on every item and send an enquiry. Our team confirms availability, pricing and fulfilment by phone or WhatsApp.",
      },
      { property: "og:title", content: "My Diwali Enquiry — Upcurv Crackers" },
      {
        property: "og:description",
        content: "Send your crackers enquiry — no login and no online payment.",
      },
    ],
  }),
  component: EnquiryPage,
});

type Done = {
  ref: string;
  estimated: number;
  itemCount: number;
  name: string;
  city: string;
  mobile: string;
  lines: { name: string; code: string | null; qty: number; price: number }[];
};

function enquiryPdf(done: Done) {
  downloadSummaryPdf({
    title: "Enquiry Summary",
    ref: done.ref,
    customer: { name: done.name, mobile: done.mobile, city: done.city },
    items: done.lines,
    note: "Our team will contact you to confirm availability, pricing and fulfilment options.",
    fileName: `Enquiry-${done.ref}.pdf`,
  });
}

function EnquiryPage() {
  const { items, add, setQty, remove, total, count, clear, ready } = useCart();
  const { lang, t } = useLang();
  const navigate = useNavigate();
  const submit = useServerFn(submitEnquiry);
  const [done, setDone] = useState<Done | null>(null);
  const [open, setOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const coupons = useQuery(couponsQuery);

  const settings = useQuery(orderSettingsQuery);
  const minOrder = settings.data?.min_order_value ?? 0;

  const [form, setForm] = useState({
    name: "",
    mobile: "",
    state: "",
    city: "",
    address: "",
    pincode: "",
    message: "",
  });

  const mrpTotal = items.reduce((s, i) => s + i.qty * (i.mrp && i.mrp > i.price ? i.mrp : i.price), 0);
  const saved = Math.max(0, mrpTotal - total);

  const appliedCoupon = (coupons.data ?? []).find((c) => c.code === couponCode) ?? null;
  const couponOff = appliedCoupon ? couponDiscount(appliedCoupon, total).discount : 0;
  const payable = Math.max(0, total - couponOff);
  const belowMinimum = minOrder > 0 && total < minOrder;

  // Nearest coupon the customer has not unlocked yet — drives the progress nudge.
  const nextCoupon = (() => {
    if (appliedCoupon) return null;
    const locked = (coupons.data ?? [])
      .filter((c) => Number(c.min_value) > total)
      .sort((a, b) => Number(a.min_value) - Number(b.min_value));
    const coupon = locked[0];
    if (!coupon) return null;
    const min = Number(coupon.min_value);
    return {
      coupon,
      gap: Math.ceil(min - total),
      pct: Math.min(100, Math.round((total / min) * 100)),
    };
  })();

  const products = useQuery(productsQuery);
  const inCart = (id: string) => items.some((i) => i.productId === id);
  const pool = (products.data ?? []).filter((p) => p.availability !== "unavailable");

  // Seller-curated add-on strip (ordered by the position set in the seller desk).
  const curatedAddons = pool
    .filter((p) => p.addon_rank != null)
    .sort((a, b) => Number(a.addon_rank) - Number(b.addon_rank));
  const suggestions = (curatedAddons.length ? curatedAddons : pool)
    .filter((p) => !inCart(p.id))
    .slice(0, 10);

  // Deal store: seller-queued products with an extra discounted price.
  const deals = pool
    .filter((p) => p.deal_rank != null)
    .sort((a, b) => Number(a.deal_rank) - Number(b.deal_rank))
    .map((p) => {
      const sellingPrice = Number(p.price);
      const mrp = p.mrp == null ? sellingPrice : Number(p.mrp);
      const dealPrice = p.deal_price != null ? Number(p.deal_price) : sellingPrice;
      const off = mrp > dealPrice ? Math.round(((mrp - dealPrice) / mrp) * 100) : 0;
      return { p, dealPrice, sellingPrice, mrp, off };
    })
    .filter((d) => !inCart(d.p.id))
    .slice(0, 12);

  const addProduct = (
    p: (typeof pool)[number],
    price: number,
    strike?: number | null,
    via: "deal" | "addon" | "other" = "other",
  ) => {
    add({
      productId: p.id,
      code: p.code,
      name: p.name,
      nameTa: p.name_ta,
      price,
      mrp: strike && strike > price ? strike : p.mrp ? Number(p.mrp) : null,
      categorySlug: null,
      imageUrl: p.image_url,
    });
    track("add_to_cart", { productId: p.id, productName: p.name, qty: 1, value: price });
    // Strip-specific events so the reports only credit the Deal Store / add-on
    // strips when the customer actually taps them here.
    if (via === "deal" || via === "addon")
      track(via === "deal" ? "deal_add" : "addon_add", {
        productId: p.id,
        productName: p.name,
        qty: 1,
        value: price,
      });
    toast.success(`${p.name} added`);
  };



  const applyCoupon = (raw: string) => {
    const code = raw.trim().toUpperCase();
    const found = (coupons.data ?? []).find((c) => c.code === code);
    if (!found) {
      toast.error("Invalid coupon code");
      return;
    }
    const res = couponDiscount(found, total);
    if (!res.ok) {
      toast.error(res.reason);
      return;
    }
    setCouponCode(found.code);
    toast.success(`Coupon applied — you save ${inr(res.discount)}`);
  };

  const mutation = useMutation({
    mutationFn: async () =>
      submit({
        data: {
          name: form.name.trim(),
          mobile: form.mobile.trim(),
          city: form.city.trim(),
          state: form.state || null,
          address: form.address.trim() || null,
          pincode: form.pincode.trim() || null,
          fulfilment: "contact",
          contactMethod: "call",
          message: form.message.trim() || null,
          freeText: null,
          source: readSource(),
          items: items.map((i) => ({
            productId: i.kind === "combo" ? null : i.productId,
            code: i.code,
            name: i.name,
            qty: i.qty,
            price: i.price,
          })),
          couponCode,
        },
      }),
    onSuccess: (res) => {
      const record: Done = {
        ...res,
        name: form.name.trim(),
        city: form.city.trim(),
        mobile: form.mobile.trim(),
        lines: items.map((i) => ({ name: i.name, code: i.code, qty: i.qty, price: i.price })),
      };
      setOpen(false);
      setDone(record);
      clear();
      // Success screen always starts at the top; the PDF is a tap away instead of
      // being generated inline (that blocked the screen for a second or two).
      window.scrollTo({ top: 0, behavior: "auto" });
    },
    onError: () => toast.error("Could not send your enquiry. Please try again."),
  });

  if (done) {
    const message = encodeURIComponent(
      `Hi, I submitted enquiry ${done.ref}.\nName: ${done.name}\nArea: ${done.city}\nProducts: ${done.itemCount} items\nEstimated catalogue value: ${inr(done.estimated)}`,
    );
    const steps = [
      "Our team reviews your enquiry",
      "We contact you",
      "Availability and pricing are confirmed",
      "Order/fulfilment is arranged according to applicable requirements",
    ];
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <CheckCircle2 className="mx-auto size-10 text-primary" />
            <h1 className="mt-3 text-2xl font-semibold">🎆 Enquiry Received!</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Enquiry ID
              <span className="ml-1 rounded-md bg-accent px-2 py-0.5 font-mono text-sm font-semibold text-accent-foreground">
                {done.ref}
              </span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              We&apos;ve received your selected products.
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-border p-5">
            <h2 className="text-lg font-semibold">What happens next?</h2>
            <ol className="mt-3 space-y-3">
              {steps.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-secondary/50 p-5">
            <p className="text-sm font-semibold">Prefer WhatsApp?</p>
            <Button asChild className="mt-3 w-full">
              <a href={`https://wa.me/${SHOP.whatsapp}?text=${message}`}>
                <MessageCircle className="size-4" /> Chat with our team
              </a>
            </Button>
            <Button variant="secondary" className="mt-2 w-full" onClick={() => enquiryPdf(done)}>
              <Download className="size-4" /> Download enquiry PDF
            </Button>
            <Button asChild variant="outline" className="mt-2 w-full">
              <Link to="/track" search={{ ref: done.ref }}>
                Track this enquiry
              </Link>
            </Button>
          </div>

          <div className="mt-6">
            <LegalNotice />
          </div>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-32">
        <h1 className="text-3xl font-semibold">{t("myEnquiry")}</h1>

        {ready && items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">{t("emptyCart")}</p>
            <Button className="mt-4" onClick={() => navigate({ to: "/catalogue", search: {} })}>
              {t("browse")}
            </Button>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {items.map((i) => {
              const hasMrp = i.mrp != null && i.mrp > i.price;
              const lineSaved = hasMrp ? (i.mrp! - i.price) * i.qty : 0;
              return (
                <div key={i.productId} className="flex items-start gap-3 p-3">
                  {i.imageUrl ? (
                    <img
                      src={i.imageUrl}
                      alt={i.name}
                      loading="lazy"
                      width={64}
                      height={48}
                      className="h-12 w-16 shrink-0 rounded-md border border-border object-cover"
                    />
                  ) : (
                    <div className="grid h-12 w-16 shrink-0 place-items-center rounded-md border border-border bg-secondary text-lg" aria-hidden="true">🎇</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{pick(lang, i.name, i.nameTa)}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.kind === "combo"
                        ? `Gift box · ${i.comboItemCount ?? 0} items inside`
                        : i.code}
                    </p>
                    <div className="mt-1 flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold">{inr(i.price * i.qty)}</span>
                      {hasMrp && (
                        <>
                          <span className="text-xs text-muted-foreground line-through">
                            {inr(i.mrp! * i.qty)}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-600">
                            Save {inr(lineSaved)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => setQty(i.productId, i.qty - 1)}
                      >
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => setQty(i.productId, i.qty + 1)}
                      >
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1 text-xs text-muted-foreground"
                      onClick={() => remove(i.productId)}
                    >
                      <Trash2 className="size-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {items.length > 0 && (
          <>
            {nextCoupon && (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-800">
                  🎁 Add {inr(nextCoupon.gap)} more to unlock {nextCoupon.coupon.code}
                </p>
                <p className="mt-0.5 text-xs text-amber-800/80">
                  {nextCoupon.coupon.label ?? "Extra savings on this enquiry"}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-amber-200">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all"
                    style={{ width: `${nextCoupon.pct}%` }}
                  />
                </div>
              </div>
            )}

            {deals.length > 0 && (
              <div className="mt-4 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-background p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Deal store
                  </span>
                  <p className="text-xs text-muted-foreground">Extra discounted, limited stock</p>
                </div>
                <div className="-mx-1 mt-3 flex gap-2.5 overflow-x-auto px-1 pb-1">
                  {deals.map(({ p, dealPrice, sellingPrice, mrp, off }) => (
                    <div
                      key={p.id}
                      className="relative w-28 shrink-0 rounded-xl border border-amber-200 bg-card p-1.5"
                    >
                      {off > 0 && (
                        <span className="shine-badge absolute left-1.5 top-1.5 z-10 overflow-hidden rounded-md bg-amber-500 px-1 py-0.5 text-[9px] font-bold text-white">
                          {off}% OFF
                        </span>
                      )}
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          loading="lazy"
                          width={160}
                          height={96}
                          className="h-16 w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="grid h-16 w-full place-items-center rounded-lg bg-secondary text-xl" aria-hidden="true">🎇</div>
                      )}
                      <p className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-tight">
                        {pick(lang, p.name, p.name_ta)}
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-rose-500 line-through">
                        MRP {inr(mrp)}
                      </p>
                      <p className="text-[10px] font-medium text-rose-500 line-through">
                        Sale {inr(sellingPrice)}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-primary">{inr(dealPrice)}</p>
                      <Button
                        size="sm"
                        className="mt-1.5 h-7 w-full text-[11px]"
                        onClick={() => addProduct(p, dealPrice, mrp, "deal")}
                      >
                        {t("add")}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="mt-4 rounded-2xl border border-border bg-card p-4">
                <h2 className="text-base font-semibold">Popular add-ons</h2>
                <p className="text-[11px] text-muted-foreground">
                  Customers usually add these to complete their Diwali box.
                </p>
                <div className="-mx-1 mt-3 flex gap-2.5 overflow-x-auto px-1 pb-1">
                  {suggestions.map((p) => (
                    <div key={p.id} className="w-24 shrink-0 rounded-xl border border-border p-1.5">
                      {p.image_url ? (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          loading="lazy"
                          width={160}
                          height={96}
                          className="h-14 w-full rounded-lg object-cover"
                        />
                      ) : (
                        <div className="grid h-14 w-full place-items-center rounded-lg bg-secondary text-lg" aria-hidden="true">🎇</div>
                      )}
                      <p className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-tight">
                        {pick(lang, p.name, p.name_ta)}
                      </p>
                      <p className="mt-0.5 text-xs font-semibold">{inr(Number(p.price))}</p>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-1.5 h-7 w-full text-[11px]"
                        onClick={() => addProduct(p, Number(p.price), null, "addon")}
                      >
                        {t("add")}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}


            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <Tag className="size-4 text-primary" /> Coupons
              </h2>
              {appliedCoupon ? (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-emerald-700">{appliedCoupon.code}</p>
                    <p className="text-xs text-emerald-700/80">
                      {appliedCoupon.label ?? "Coupon applied"} · saves {inr(couponOff)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCouponCode(null);
                      setCouponInput("");
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <>
                  <div className="mt-3 flex gap-2">
                    <Input
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code"
                      className="h-11 flex-1 uppercase"
                    />
                    <Button className="h-11" onClick={() => applyCoupon(couponInput)}>
                      Apply
                    </Button>
                  </div>
                  {(coupons.data ?? []).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {(coupons.data ?? []).map((c) => {
                        const min = Number(c.min_value);
                        const gap = Math.max(0, Math.ceil(min - total));
                        const pct = min > 0 ? Math.min(100, Math.round((total / min) * 100)) : 100;
                        return (
                          <div
                            key={c.id}
                            className="rounded-xl border border-dashed border-border px-3 py-2.5"
                          >
                            <div className="flex items-start gap-2">
                              <span className="shrink-0 rounded-md bg-accent px-2 py-0.5 font-mono text-xs font-semibold">
                                {c.code}
                              </span>
                              <p className="min-w-0 flex-1 text-xs leading-snug text-muted-foreground">
                                {c.label ?? "Offer"}
                              </p>
                              <button
                                onClick={() => applyCoupon(c.code)}
                                disabled={gap > 0}
                                className="shrink-0 text-xs font-semibold text-primary disabled:text-muted-foreground"
                              >
                                Apply
                              </button>
                            </div>
                            {gap > 0 && (
                              <div className="mt-2">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  Add {inr(gap)} more to use this coupon
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>


            <div className="mt-4 rounded-2xl border border-border bg-card p-5">
              <h2 className="text-lg font-semibold">Bill details</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Catalogue value ({count} items)</span>
                  <span className="font-medium">{inr(mrpTotal)}</span>
                </div>
                {saved > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Discount</span>
                    <span className="font-medium text-emerald-600">− {inr(saved)}</span>
                  </div>
                )}
                {couponOff > 0 && appliedCoupon && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Coupon ({appliedCoupon.code})</span>
                    <span className="font-medium text-emerald-600">− {inr(couponOff)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Delivery / pickup</span>
                  <span className="font-medium">Confirmed by seller</span>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                <span className="text-base font-semibold">{t("estimated")}</span>
                <div className="text-right">
                  {saved > 0 && (
                    <span className="mr-2 text-sm text-muted-foreground line-through">
                      {inr(mrpTotal)}
                    </span>
                  )}
                  <span className="text-xl font-bold">{inr(payable)}</span>
                </div>
              </div>
              {saved > 0 && (
                <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                  🎉 You save {inr(saved + couponOff)} on this enquiry
                </p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Final availability, pricing and fulfilment will be confirmed by our team.
              </p>
            </div>

            <div className="mt-5">
              <LegalNotice compact />
            </div>

            <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-30 border-t border-border bg-background/95 p-3 backdrop-blur md:bottom-0">
              <div className="mx-auto w-full max-w-3xl">
                {belowMinimum && (
                  <div className="mb-2 rounded-lg bg-rose-50 px-3 py-1.5 text-[11px] font-medium text-rose-600">
                    Minimum enquiry value is {inr(minOrder)} — add {inr(minOrder - total)} more to
                    send this enquiry.
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{count} items</p>
                    <p className="text-lg font-bold leading-none">{inr(payable)}</p>
                  </div>
                  <Button
                    size="lg"
                    className="ml-auto flex-1 disabled:opacity-50"
                    disabled={belowMinimum}
                    onClick={() => setOpen(true)}
                  >
                    {belowMinimum ? `Add ${inr(minOrder - total)} more` : t("sendEnquiry")}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-3xl p-5 sm:rounded-3xl">
          <DialogHeader>
            <DialogTitle>Your details</DialogTitle>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (
                !form.name.trim() ||
                form.mobile.trim().length < 8 ||
                !form.state ||
                !form.city.trim() ||
                !form.address.trim() ||
                form.pincode.trim().length < 4
              ) {
                toast.error("Please fill name, mobile, state, city, address and pincode.");
                return;
              }
              if (minOrder > 0 && total < minOrder) {
                toast.error(`Minimum enquiry value is ${inr(minOrder)}.`);
                return;
              }
              mutation.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="name">Name*</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mobile">Mobile number*</Label>
              <Input
                id="mobile"
                inputMode="tel"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>State*</Label>
              <Select
                value={form.state}
                onValueChange={(v) => setForm({ ...form, state: v, city: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {STATES.map((s) => (
                    <SelectItem
                      key={s}
                      value={s}
                      className={s === TAMIL_NADU ? "font-semibold text-primary" : ""}
                    >
                      {s}
                      {s === TAMIL_NADU ? " ★" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City / Area*</Label>
                <Select
                  value={form.city}
                  disabled={!form.state}
                  onValueChange={(v) => setForm({ ...form, city: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={form.state ? "Select city" : "Select state first"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {citiesFor(form.state).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pincode">Pincode*</Label>
                <Input
                  id="pincode"
                  inputMode="numeric"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address*</Label>
              <Textarea
                id="address"
                rows={2}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Optional note</Label>
              <Textarea
                id="message"
                rows={2}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? "Sending…" : t("sendEnquiry")}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">
              Enquiry only · no online payment
            </p>
          </form>
        </DialogContent>
      </Dialog>
    </SiteShell>
  );
}
