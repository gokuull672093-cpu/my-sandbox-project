import { Check, Plus, Minus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { categoryImage, PROMO_TAG_LABEL, type Product } from "@/lib/catalog";
import { useCart } from "@/lib/enquiry-cart";
import { pick, useLang } from "@/lib/i18n";
import { inr } from "@/lib/shop";

const AVAIL_DOTS: Record<string, string> = {
  available: "bg-emerald-500",
  limited: "bg-amber-500",
  unavailable: "bg-rose-500",
  enquiry_only: "bg-muted-foreground",
};

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="shimmer aspect-square w-full" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-3 w-14" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </div>
  );
}

export function ProductCard({
  product,
  categorySlug,
}: {
  product: Product;
  categorySlug: string | null;
}) {
  const { lang, t } = useLang();
  const { add, items, setQty } = useCart();
  const [flash, setFlash] = useState(false);
  const inCart = items.find((i) => i.productId === product.id);
  const disabled = product.availability === "unavailable";
  const price = Number(product.price);
  const mrp = product.mrp ? Number(product.mrp) : null;
  const promoTag = product.tags.find((tag) => PROMO_TAG_LABEL[tag]);

  return (
    <div className="group elevate elevate-hover flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative aspect-square overflow-hidden bg-secondary/40">
        <img
          src={product.image_url || categoryImage(categorySlug)}
          alt={product.name}
          loading="lazy"
          width={900}
          height={900}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {promoTag && (
          <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm">
            {PROMO_TAG_LABEL[promoTag]}
          </span>
        )}
        <span
          className={`absolute right-2 top-2 size-3 rounded-full border-2 border-card shadow-sm ${AVAIL_DOTS[product.availability]}`}
          aria-label={t(product.availability as "available")}
          title={t(product.availability as "available")}
        />
      </div>

      <div className="flex flex-1 flex-col p-3">
        <span className="text-[10px] font-medium tracking-wide text-muted-foreground">
          {product.code} · {product.pack}
        </span>
        <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
          {pick(lang, product.name, product.name_ta)}
        </h3>
        {lang === "en" && product.name_ta && (
          <p className="line-clamp-1 text-xs text-muted-foreground">{product.name_ta}</p>
        )}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-semibold">{inr(price)}</span>
          {mrp && mrp > price && (
            <>
              <span className="text-xs text-muted-foreground line-through">{inr(mrp)}</span>
              <span className="text-[10px] font-semibold text-primary">
                {Math.round((1 - price / mrp) * 100)}% off
              </span>
            </>
          )}
        </div>

        <div className="mt-3">
          {inCart ? (
            <div className="flex items-center justify-between rounded-lg border border-border p-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setQty(product.id, inCart.qty - 1)}
              >
                <Minus className="size-3.5" />
              </Button>
              <span className="text-sm font-semibold">{inCart.qty}</span>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => setQty(product.id, inCart.qty + 1)}
              >
                <Plus className="size-3.5" />
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant={disabled ? "secondary" : "default"}
              className="w-full"
              onClick={() => {
                add({
                  productId: product.id,
                  code: product.code,
                  name: product.name,
                  nameTa: product.name_ta,
                  price,
                  mrp,
                  categorySlug,
                  imageUrl: product.image_url,
                });
                setFlash(true);
                setTimeout(() => setFlash(false), 1200);
              }}
            >
              {flash ? (
                <>
                  <Check className="size-4" /> {t("added")}
                </>
              ) : (
                t("addToEnquiry")
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
