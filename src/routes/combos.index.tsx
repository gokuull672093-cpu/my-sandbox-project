import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import { SiteShell } from "@/components/site-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryImage, combosQuery } from "@/lib/catalog";
import { pick, useLang } from "@/lib/i18n";
import { inr } from "@/lib/shop";

export const Route = createFileRoute("/combos/")({
  head: () => ({
    meta: [
      { title: "Diwali Combos & Gift Boxes — Upcurv Crackers" },
      {
        name: "description",
        content:
          "Seller-configured Diwali combos: family combo, kids joy combo and premium collection. Tap a combo to see everything inside.",
      },
      { property: "og:title", content: "Diwali Combos & Gift Boxes — Upcurv Crackers" },
      {
        property: "og:description",
        content: "Ready-made combos put together by our shop. Indicative pricing only.",
      },
    ],
  }),
  component: Combos,
});

function Combos() {
  const { data, isLoading } = useQuery(combosQuery);
  const { lang } = useLang();

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <h1 className="text-3xl font-semibold">Combos &amp; Gift Boxes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Collections put together by our shop. Prices are indicative and confirmed on contact.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border p-4">
                  <div className="shimmer h-32 w-full rounded-xl" />
                  <Skeleton className="mt-4 h-5 w-2/3" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-4 h-9 w-full rounded-lg" />
                </div>
              ))
            : (data ?? []).map((combo) => {
                const lines = combo.combo_items.filter((ci) => ci.products);
                const itemsTotal = lines.reduce(
                  (s, ci) => s + ci.qty * Number(ci.products?.price ?? 0),
                  0,
                );
                const saved = Math.max(0, itemsTotal - Number(combo.indicative_price));
                return (
                  <Link
                    key={combo.id}
                    to="/combos/$slug"
                    params={{ slug: combo.slug }}
                    className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.15)]"
                  >
                    <img
                      src={combo.image_url || categoryImage("gift-boxes")}
                      alt={combo.title}
                      loading="lazy"
                      width={900}
                      height={900}
                      className="h-36 w-full object-cover"
                    />
                    <div className="flex flex-1 flex-col p-4">
                      <h2 className="cursor-pointer text-lg font-semibold group-hover:text-primary">
                        🎇 {pick(lang, combo.title, combo.title_ta)}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {combo.description}
                      </p>
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-lg font-bold">{inr(combo.indicative_price)}</span>
                        {saved > 0 && (
                          <span className="text-sm text-muted-foreground line-through">
                            {inr(itemsTotal)}
                          </span>
                        )}
                      </div>
                      {saved > 0 && (
                        <p className="mt-1 text-xs font-semibold text-emerald-700">
                          You save {inr(saved)}
                        </p>
                      )}
                      <span className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary group-hover:underline">
                        Tap to view {lines.length} items <ChevronRight className="size-4" />
                      </span>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </SiteShell>
  );
}
