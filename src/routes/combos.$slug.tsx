import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryImage, combosQuery } from "@/lib/catalog";
import { useCart } from "@/lib/enquiry-cart";
import { pick, useLang } from "@/lib/i18n";
import { inr } from "@/lib/shop";

export const Route = createFileRoute("/combos/$slug")({
  head: () => ({
    meta: [
      { title: "Combo Details — Upcurv Crackers" },
      {
        name: "description",
        content: "Everything inside this Diwali combo — items, indicative value and savings.",
      },
      { property: "og:title", content: "Combo Details — Upcurv Crackers" },
      { property: "og:description", content: "See all items, prices and savings in this combo." },
    ],
  }),
  component: ComboDetail,
});

function ComboDetail() {
  const { slug } = Route.useParams();
  const { data, isLoading } = useQuery(combosQuery);
  const { add } = useCart();
  const { lang } = useLang();
  const navigate = useNavigate();

  const combo = (data ?? []).find((c) => c.slug === slug);

  if (isLoading) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl space-y-3 px-4 py-6">
          <div className="shimmer h-44 w-full rounded-2xl" />
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <div className="shimmer h-64 w-full rounded-2xl" />
        </div>
      </SiteShell>
    );
  }

  if (!combo) {
    return (
      <SiteShell>
        <div className="mx-auto w-full max-w-3xl px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">This combo is no longer available.</p>
          <Button className="mt-4" asChild>
            <Link to="/combos">Back to combos</Link>
          </Button>
        </div>
      </SiteShell>
    );
  }

  const lines = combo.combo_items.filter((ci) => ci.products);
  const itemsTotal = lines.reduce((s, ci) => s + ci.qty * Number(ci.products?.price ?? 0), 0);
  const mrpTotal = lines.reduce(
    (s, ci) => s + ci.qty * Number(ci.products?.mrp ?? ci.products?.price ?? 0),
    0,
  );
  const comboPrice = Number(combo.indicative_price);
  const saved = Math.max(0, mrpTotal - comboPrice);

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-3xl px-4 py-6">
        <Link
          to="/combos"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground"
        >
          <ArrowLeft className="size-4" /> All combos
        </Link>

        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
          <img
            src={combo.image_url || categoryImage("gift-boxes")}
            alt={combo.title}
            width={1200}
            height={600}
            className="h-44 w-full object-cover sm:h-56"
          />
          <div className="p-5">
            <h1 className="text-2xl font-semibold">🎇 {pick(lang, combo.title, combo.title_ta)}</h1>
            <p className="mt-1 text-sm text-muted-foreground">{combo.description}</p>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
          <h2 className="border-b border-border p-4 text-lg font-semibold">
            What&apos;s inside ({lines.length} items)
          </h2>
          <div className="divide-y divide-border">
            {lines.map((ci, idx) => {
              const p = ci.products!;
              const price = Number(p.price);
              const mrp = p.mrp == null ? null : Number(p.mrp);
              return (
                <div key={idx} className="flex items-center gap-3 p-3">
                  <img
                    src={p.image_url || categoryImage(null)}
                    alt={p.name}
                    loading="lazy"
                    width={64}
                    height={48}
                    className="h-12 w-16 shrink-0 rounded-md border border-border object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{pick(lang, p.name, p.name_ta)}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.code} · × {ci.qty}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold">{inr(price * ci.qty)}</p>
                    {mrp && mrp > price && (
                      <p className="text-xs text-muted-foreground line-through">
                        {inr(mrp * ci.qty)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Combo value</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Items if bought at MRP</span>
              <span className="font-medium line-through">{inr(mrpTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Catalogue value</span>
              <span className="font-medium">{inr(itemsTotal)}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-base font-semibold">Combo price (indicative)</span>
            <span className="text-xl font-bold">{inr(comboPrice)}</span>
          </div>
          {saved > 0 && (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              🎉 You save {inr(saved)} on this combo
            </p>
          )}
          <Button
            size="lg"
            className="mt-4 w-full"
            onClick={() => {
              add({
                productId: combo.id,
                code: combo.slug.toUpperCase(),
                name: combo.title,
                nameTa: combo.title_ta,
                price: comboPrice,
                mrp: mrpTotal > comboPrice ? mrpTotal : null,
                categorySlug: "gift-boxes",
                imageUrl: combo.image_url,
                kind: "combo",
                comboItemCount: lines.length,
              });
              toast.success(`${combo.title} added to your enquiry`);
              navigate({ to: "/enquiry" });
            }}
          >
            Add Combo to Enquiry
          </Button>

          <p className="mt-2 text-xs text-muted-foreground">
            Final availability, pricing and fulfilment are confirmed by our team.
          </p>
        </div>
      </div>
    </SiteShell>
  );
}
