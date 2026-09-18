import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Minus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoriesQuery, productsQuery } from "@/lib/catalog";
import { useCart } from "@/lib/enquiry-cart";
import { pick as pickLang, useLang } from "@/lib/i18n";
import { inr } from "@/lib/shop";

const BUDGETS = [1000, 2000, 3000, 5000, 10000];

export const Route = createFileRoute("/build-box")({
  validateSearch: (search: Record<string, unknown>): { budget?: number } => {
    const out: { budget?: number } = {};
    const raw = Number(search["budget"]);
    if (Number.isFinite(raw) && raw > 0) out.budget = raw;
    return out;
  },
  head: () => ({
    meta: [
      { title: "Build My Diwali Box — Upcurv Crackers" },
      {
        name: "description",
        content:
          "Pick your budget, then choose items category by category to build your own Diwali box and send it to our shop as an enquiry.",
      },
      { property: "og:title", content: "Build My Diwali Box — Upcurv Crackers" },
      {
        property: "og:description",
        content: "Step-by-step Diwali box builder — choose category by category.",
      },
    ],
  }),
  component: BuildBox,
});

function BuildBox() {
  const initial = Route.useSearch().budget;
  const [budget, setBudget] = useState<number>(initial ?? 2000);
  const [step, setStep] = useState(0); // 0 = budget, 1..n = categories, n+1 = review
  const [picks, setPicks] = useState<Record<string, number>>({});
  const products = useQuery(productsQuery);
  const categories = useQuery(categoriesQuery);
  const { add } = useCart();
  const navigate = useNavigate();
  const { lang, t } = useLang();

  const goToStep = (next: number) => {
    setStep(next);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const loading = products.isLoading || categories.isLoading;

  const cats = useMemo(() => {
    const list = categories.data ?? [];
    const items = products.data ?? [];
    return list.filter((c) => items.some((p) => p.category_id === c.id));
  }, [categories.data, products.data]);

  const chosen = useMemo(() => {
    const items = products.data ?? [];
    return Object.entries(picks)
      .filter(([, qty]) => qty > 0)
      .map(([id, qty]) => ({ product: items.find((p) => p.id === id)!, qty }))
      .filter((x) => x.product);
  }, [picks, products.data]);

  const spent = chosen.reduce((s, x) => s + Number(x.product.price) * x.qty, 0);
  const pct = budget > 0 ? Math.min(100, Math.round((spent / budget) * 100)) : 0;

  const totalSteps = cats.length + 2; // budget + categories + review
  const isReview = step === totalSteps - 1;
  const activeCat = !isReview && step > 0 ? cats[step - 1] : null;

  const catProducts = useMemo(
    () =>
      (products.data ?? []).filter(
        (p) => activeCat && p.category_id === activeCat.id && p.availability !== "unavailable",
      ),
    [products.data, activeCat],
  );

  const setQty = (id: string, qty: number) =>
    setPicks((prev) => ({ ...prev, [id]: Math.max(0, qty) }));

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-6 pb-40">
        <h1 className="text-3xl font-semibold">{t("buildTitle")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("buildSub")}</p>

        {/* progress */}
        <div className="mt-4 flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          {t("step")} {step + 1} {t("of")} {totalSteps}
          {activeCat
            ? ` · ${pickLang(lang, activeCat.name, activeCat.name_ta)}`
            : isReview
              ? ` · ${t("review")}`
              : ` · ${t("budget")}`}
        </p>

        {loading && (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-border p-3">
                <div className="shimmer size-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 0: budget */}
        {!loading && step === 0 && (
          <div className="mt-6 rounded-2xl border border-border bg-card p-4">
            <p className="text-sm font-semibold">{t("myBudget")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BUDGETS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBudget(b)}
                  className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                    budget === b
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  {inr(b)}
                  {b === 10000 ? "+" : ""}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">{t("budgetHint")}</p>
          </div>
        )}

        {/* Category steps */}
        {!loading && activeCat && (
          <div className="mt-5 space-y-2">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
              {activeCat.image_url ? (
                <img
                  src={activeCat.image_url}
                  alt={activeCat.name}
                  loading="lazy"
                  width={96}
                  height={96}
                  className="size-12 rounded-lg object-cover"
                />
              ) : (
                <div className="grid size-12 place-items-center rounded-lg bg-secondary text-lg" aria-hidden="true">{activeCat.emoji ?? "🎇"}</div>
              )}
              <div>
                <p className="text-sm font-semibold">
                  {activeCat.emoji} {pickLang(lang, activeCat.name, activeCat.name_ta)}
                </p>
                <p className="text-xs text-muted-foreground">{t("pickOrSkip")}</p>
              </div>
            </div>

            {catProducts.map((p) => {
              const qty = picks[p.id] ?? 0;
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 rounded-xl border bg-card p-3 ${qty > 0 ? "border-primary" : "border-border"}`}
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      width={96}
                      height={96}
                      className="size-12 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary text-lg" aria-hidden="true">🎇</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {pickLang(lang, p.name, p.name_ta)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.code}
                      {p.pack ? ` · ${p.pack}` : ""}
                    </p>
                    <p className="mt-0.5 flex items-baseline gap-1.5">
                      <span className="text-sm font-bold text-primary">{inr(p.price)}</span>
                      {p.mrp && Number(p.mrp) > Number(p.price) && (
                        <>
                          <span className="text-[11px] text-muted-foreground line-through">
                            {inr(Number(p.mrp))}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600">
                            {Math.round((1 - Number(p.price) / Number(p.mrp)) * 100)}% off
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  {qty > 0 ? (
                    <div className="flex shrink-0 items-center gap-1 rounded-full border border-border">
                      <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => setQty(p.id, qty - 1)}>
                        <Minus className="size-3.5" />
                      </Button>
                      <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                      <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => setQty(p.id, qty + 1)}>
                        <Plus className="size-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <Button size="sm" className="shrink-0" onClick={() => setQty(p.id, 1)}>
                      {t("add")}
                    </Button>
                  )}
                </div>
              );
            })}

            {catProducts.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("noneHere")}</p>
            )}
          </div>
        )}

        {/* Review */}
        {!loading && isReview && (
          <div className="mt-5 space-y-2">
            {chosen.length === 0 && (
              <p className="py-10 text-center text-sm text-muted-foreground">
                {t("nothingPicked")}
              </p>
            )}
            {chosen.map(({ product, qty }) => (
              <div
                key={product.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    width={96}
                    height={96}
                    className="size-12 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary text-lg" aria-hidden="true">🎇</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {pickLang(lang, product.name, product.name_ta)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {product.code} · × {qty}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-semibold">
                  {inr(Number(product.price) * qty)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky footer */}
      {!loading && (
        <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 border-t border-border bg-background/95 backdrop-blur md:bottom-0">
          <div className="mx-auto w-full max-w-3xl px-4 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">
                {chosen.reduce((s, x) => s + x.qty, 0)} {t("items")} · {inr(spent)}
              </span>
              <span className={spent > budget ? "text-destructive" : "text-muted-foreground"}>
                {t("budget")} {inr(budget)}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${spent > budget ? "bg-destructive" : "bg-primary"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2.5 flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => goToStep(step - 1)}>
                  <ArrowLeft className="size-4" /> {t("back")}
                </Button>
              )}
              {!isReview ? (
                <Button className="flex-1" onClick={() => goToStep(step + 1)}>
                  {step === 0 ? t("startPicking") : t("next")} <ArrowRight className="size-4" />
                </Button>
              ) : (
                <Button
                  className="flex-1"
                  disabled={chosen.length === 0}
                  onClick={() => {
                    chosen.forEach(({ product, qty }) =>
                      add(
                        {
                          productId: product.id,
                          code: product.code,
                          name: product.name,
                          nameTa: product.name_ta,
                          price: Number(product.price),
                          mrp: product.mrp == null ? null : Number(product.mrp),
                          categorySlug: null,
                          imageUrl: product.image_url,
                        },
                        qty,
                      ),
                    );
                    toast.success("Your box was added to the enquiry");
                    navigate({ to: "/enquiry" });
                  }}
                >
                  <Check className="size-4" /> {t("addMyBox")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </SiteShell>
  );
}
