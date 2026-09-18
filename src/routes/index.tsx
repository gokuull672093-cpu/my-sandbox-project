import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight, BadgeCheck, ScanLine, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { Suspense } from "react";

import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { LegalNotice, SiteShell } from "@/components/site-shell";
import { Button } from "@/components/ui/button";
import { categoriesQuery, combosQuery, popularProductsQuery, productsQuery } from "@/lib/catalog";
import { categoryTint } from "@/lib/category-icons";
import { useLang, pick } from "@/lib/i18n";
import { inr, SHOP } from "@/lib/shop";
import { siteVisualsQuery } from "@/lib/settings";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Upcurv Crackers — Diwali 2026 Catalogue & Enquiry" },
      {
        name: "description",
        content:
          "Browse the Diwali 2026 crackers catalogue from Upcurv Crackers, Coimbatore. Build your enquiry and our team will confirm availability, pricing and fulfilment.",
      },
      { property: "og:title", content: "Upcurv Crackers — Diwali 2026 Catalogue" },
      {
        property: "og:description",
        content: "Browse, build your Diwali box and send an enquiry. No online payment.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const COMBO_THEMES = [
  "from-rose-50 to-rose-100/70 text-rose-700",
  "from-emerald-50 to-emerald-100/70 text-emerald-700",
  "from-amber-50 to-amber-100/70 text-amber-700",
  "from-violet-50 to-violet-100/70 text-violet-700",
];

function FeaturedProducts() {
  const { data: products } = useSuspenseQuery(productsQuery);
  const { data: picked } = useSuspenseQuery(popularProductsQuery);
  const { data: categories } = useSuspenseQuery(categoriesQuery);
  const slugOf = (id: string | null) => categories.find((c) => c.id === id)?.slug ?? null;
  // Seller-chosen popular products; falls back to the catalogue order.
  const list = (picked.length ? picked : products).slice(0, 8);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {list.map((p) => (
        <ProductCard key={p.id} product={p} categorySlug={slugOf(p.category_id)} />
      ))}
    </div>
  );
}

function CategoryRail() {
  const categories = useQuery(categoriesQuery);
  const { lang } = useLang();

  return (
    <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-visible sm:px-0 lg:grid-cols-9">
      {categories.isLoading
        ? Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex w-20 shrink-0 flex-col items-center gap-2">
              <div className="shimmer size-16 rounded-full" />
              <div className="shimmer h-3 w-14 rounded" />
            </div>
          ))
        : (categories.data ?? []).map((c, idx) => (
            <Link
              key={c.id}
              to="/catalogue"
              search={{ category: c.slug }}
              className="group flex w-20 shrink-0 flex-col items-center gap-2 sm:w-auto"
            >
              <span
                className={`grid size-16 place-items-center rounded-full ${categoryTint(idx)} transition-transform duration-300 group-hover:-translate-y-1`}
              >
                {c.image_url ? (
                  <img
                    src={c.image_url}
                    alt={c.name}
                    loading="lazy"
                    width={512}
                    height={512}
                    className="size-10 object-contain"
                  />
                ) : (
                  <span className="text-xl" aria-hidden="true">{c.emoji ?? "🎇"}</span>
                )}
              </span>
              <span className="line-clamp-2 text-center text-[11px] font-medium leading-tight">
                {pick(lang, c.name, c.name_ta)}
              </span>
            </Link>
          ))}
    </div>
  );
}

function ComboRail() {
  const combos = useQuery(combosQuery);
  const { lang } = useLang();

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {combos.isLoading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer h-36 rounded-2xl" />
          ))
        : (combos.data ?? []).map((c, idx) => (
            <Link
              key={c.id}
              to="/combos/$slug"
              params={{ slug: c.slug }}
              className={`elevate elevate-hover relative flex min-h-36 items-center overflow-hidden rounded-2xl bg-gradient-to-br p-4 ${COMBO_THEMES[idx % COMBO_THEMES.length]}`}
            >
              <div className="relative z-10 max-w-[62%]">
                <p className="text-lg font-bold">{inr(c.indicative_price)}</p>
                <p className="font-display text-base font-semibold leading-tight">
                  {pick(lang, c.title, c.title_ta)}
                </p>
                <p className="mt-1 line-clamp-2 text-xs text-foreground/60">{c.description}</p>
                <span className="mt-3 grid size-7 place-items-center rounded-full bg-current">
                  <ArrowRight className="size-3.5 text-background" />
                </span>
              </div>
              {c.image_url && (
                <img
                  src={c.image_url}
                  alt={c.title}
                  loading="lazy"
                  width={512}
                  height={512}
                  className="absolute -bottom-2 right-0 size-28 object-contain opacity-95"
                />
              )}
            </Link>
          ))}
    </div>
  );
}

function Home() {
  const { lang, t } = useLang();
  const visuals = useQuery(siteVisualsQuery);
  const heroImageUrl = visuals.data?.hero_image_url;

  return (
    <SiteShell showFooter>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-accent/40 to-background">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-8 px-4 py-10 md:grid-cols-[1.05fr_1fr] md:py-16">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium shadow-sm">
              <Sparkles className="size-3.5 text-primary" /> {SHOP.season}
            </span>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] md:text-6xl">
              {pick(lang, "Light up happiness", "மகிழ்ச்சியை ஒளிரச் செய்யுங்கள்")}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
              {pick(
                lang,
                "Coimbatore's licensed crackers store, now online. Browse the catalogue, build your box and send an enquiry — our team confirms availability and pricing personally.",
                "கோயம்புத்தூரின் உரிமம் பெற்ற பட்டாசு கடை, இப்போது ஆன்லைனில். அட்டவணையை பாருங்கள், பெட்டியை உருவாக்குங்கள், விசாரணை அனுப்புங்கள் — எங்கள் குழு தனிப்பட்ட முறையில் உறுதி செய்யும்.",
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild size="lg">
                <Link to="/catalogue" search={{}}>
                  {t("browse")} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link to="/build-box" search={{}}>
                  {t("buildBox")}
                </Link>
              </Button>
            </div>
            <div className="mt-7 grid grid-cols-3 gap-3 text-xs">
              {[
                { icon: ShieldCheck, en: "Licensed seller", ta: "உரிமம் பெற்ற விற்பனையாளர்" },
                { icon: BadgeCheck, en: "Best season prices", ta: "சிறந்த சீசன் விலை" },
                { icon: Truck, en: "Pickup & delivery help", ta: "பிக்கப் & டெலிவரி உதவி" },
              ].map((f) => (
                <div key={f.en} className="flex items-start gap-2 text-muted-foreground">
                  <f.icon className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="leading-tight">{pick(lang, f.en, f.ta)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-lg">
            {heroImageUrl ? (
              <img
                src={heroImageUrl}
                alt="Diwali crackers gift box, rockets, sparklers and a lit diya lamp"
                width={1456}
                height={1080}
                fetchPriority="high"
                className="h-64 w-full object-cover md:h-[26rem]"
              />
            ) : (
              <div className="grid h-64 place-items-center px-6 text-center text-sm text-muted-foreground md:h-[26rem]">
                Hero image will appear here once added in Settings.
              </div>
            )}
          </div>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 pb-8">
          <LegalNotice />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t("shopByCategory")}
        </h2>
        <div className="mt-4">
          <CategoryRail />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">
              {pick(lang, "Popular collections", "பிரபல தொகுப்புகள்")}
            </p>
            <h2 className="font-display text-2xl font-semibold">
              {pick(lang, "Celebrate Every Moment", "ஒவ்வொரு தருணத்தையும் கொண்டாடுங்கள்")}
            </h2>
          </div>
          <Link to="/combos" className="text-sm font-medium text-primary">
            {pick(lang, "View all combos", "அனைத்து காம்போக்கள்")} →
          </Link>
        </div>
        <div className="mt-4">
          <ComboRail />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold">{t("popular")}</h2>
          <Link to="/catalogue" search={{}} className="text-sm font-medium text-primary">
            {t("viewAll")}
          </Link>
        </div>
        <div className="mt-4">
          <Suspense
            fallback={
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            }
          >
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-4">
        <div className="flex flex-col items-start gap-3 rounded-2xl border border-border bg-secondary/50 p-5 sm:flex-row sm:items-center">
          <ScanLine className="size-8 text-primary" />
          <div className="text-sm">
            <p className="font-semibold">Scan to view our Diwali catalogue</p>
            <p className="text-muted-foreground">
              Ask at the counter for our QR code, or share this page on WhatsApp.
            </p>
          </div>
          <Button asChild variant="outline" className="sm:ml-auto">
            <a href={`https://wa.me/${SHOP.whatsapp}`}>Chat with our team</a>
          </Button>
        </div>
      </section>
    </SiteShell>
  );
}
