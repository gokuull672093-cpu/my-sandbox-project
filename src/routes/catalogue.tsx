import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { SiteShell } from "@/components/site-shell";
import { Input } from "@/components/ui/input";
import { categoriesQuery, EXPERIENCES, productsQuery } from "@/lib/catalog";
import { categoryTint } from "@/lib/category-icons";
import { pick, useLang } from "@/lib/i18n";

type CatalogueSearch = { category?: string; experience?: string; q?: string };

export const Route = createFileRoute("/catalogue")({
  validateSearch: (search: Record<string, unknown>): CatalogueSearch => {
    const out: CatalogueSearch = {};
    if (typeof search["category"] === "string") out.category = search["category"];
    if (typeof search["experience"] === "string") out.experience = search["experience"];
    if (typeof search["q"] === "string") out.q = search["q"];
    return out;
  },
  head: () => ({
    meta: [
      { title: "Crackers Catalogue — Upcurv Crackers" },
      {
        name: "description",
        content:
          "Sparklers, flower pots, chakkars, rockets, fancy items and gift boxes. Add items to your enquiry list.",
      },
      { property: "og:title", content: "Crackers Catalogue — Upcurv Crackers" },
      {
        property: "og:description",
        content: "Browse the full Diwali crackers catalogue and build your enquiry.",
      },
    ],
  }),
  component: Catalogue,
});

function Catalogue() {
  const { category, experience, q: urlQ } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { lang, t } = useLang();
  const [q, setQ] = useState(urlQ ?? "");

  useEffect(() => {
    setQ(urlQ ?? "");
  }, [urlQ]);

  const products = useQuery(productsQuery);
  const categories = useQuery(categoriesQuery);

  const filtered = useMemo(() => {
    const cats = categories.data ?? [];
    const catById = new Map(cats.map((c) => [c.id, c]));
    return (products.data ?? []).filter((p) => {
      const cat = p.category_id ? catById.get(p.category_id) : undefined;
      if (category && cat?.slug !== category) return false;
      if (experience && cat?.experience !== experience) return false;
      if (q) {
        const hay = `${p.code} ${p.name} ${p.name_ta ?? ""} ${p.pack ?? ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [products.data, categories.data, category, experience, q]);

  const slugOf = (id: string | null) =>
    (categories.data ?? []).find((c) => c.id === id)?.slug ?? null;
  const loading = products.isLoading || categories.isLoading;

  return (
    <SiteShell>
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <h1 className="text-3xl font-semibold">{t("catalogue")}</h1>

        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search")}
            className="h-11 pl-9"
          />
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t("shopByCategory")}</h2>
            {(category || experience) && (
              <button
                onClick={() => navigate({ search: {} })}
                className="text-xs font-semibold text-primary"
              >
                {t("allCategories")}
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-9">
            {categories.isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="shimmer size-14 rounded-full" />
                    <div className="shimmer h-3 w-12 rounded" />
                  </div>
                ))
              : (categories.data ?? []).map((c, idx) => {
                  const on = category === c.slug;
                  return (
                    <button
                      key={c.id}
                      onClick={() => navigate({ search: on ? {} : { category: c.slug } })}
                      className="group flex flex-col items-center gap-2"
                    >
                      <span
                        className={`grid size-14 place-items-center rounded-full transition-transform duration-300 group-hover:-translate-y-1 ${categoryTint(idx)} ${on ? "ring-2 ring-primary ring-offset-2" : ""}`}
                      >
                        {c.image_url ? (
                          <img
                            src={c.image_url}
                            alt={c.name}
                            loading="lazy"
                            width={512}
                            height={512}
                            className="size-9 object-contain"
                          />
                        ) : (
                          <span className="text-lg" aria-hidden="true">{c.emoji ?? "🎇"}</span>
                        )}
                      </span>
                      <span
                        className={`line-clamp-2 text-center text-[11px] leading-tight ${on ? "font-semibold text-primary" : "font-medium"}`}
                      >
                        {pick(lang, c.name, c.name_ta)}
                      </span>
                    </button>
                  );
                })}
          </div>

        </div>

        <div className="-mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
          {EXPERIENCES.map((e) => (
            <button
              key={e.key}
              onClick={() =>
                navigate({ search: experience === e.key ? {} : { experience: e.key } })
              }
              className={`shrink-0 rounded-full border px-3 py-1 text-xs ${experience === e.key ? "border-primary bg-accent" : "border-border bg-card text-muted-foreground"}`}
            >
              {e.emoji} {pick(lang, e.label, e.labelTa)}
            </button>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {loading
            ? Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : filtered.map((p) => (
                <ProductCard key={p.id} product={p} categorySlug={slugOf(p.category_id)} />
              ))}
        </div>

        {!loading && filtered.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">{t("noMatch")}</p>
        )}
      </div>
    </SiteShell>
  );
}
