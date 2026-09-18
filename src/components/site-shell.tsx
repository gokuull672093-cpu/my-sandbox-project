import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Gift,
  Grid2x2,
  Heart,
  Home,
  Menu,
  MessageCircle,
  Phone,
  Search,
  ShoppingCart,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

function BoxNudge() {
  const { lang } = useLang();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  // Never interrupt the builder itself or the enquiry (cart) page.
  const onBuilder = pathname.startsWith("/build-box") || pathname.startsWith("/enquiry");

  useEffect(() => {
    if (onBuilder || dismissed) return;
    let hide: ReturnType<typeof setTimeout>;
    const cycle = () => {
      setShow(true);
      hide = setTimeout(() => setShow(false), 7000);
    };
    const first = setTimeout(cycle, 6000);
    const timer = setInterval(cycle, 30000);
    return () => {
      clearTimeout(first);
      clearTimeout(hide);
      clearInterval(timer);
    };
  }, [onBuilder, dismissed]);

  if (onBuilder || dismissed || !show) return null;

  return (
    <div className="fixed inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+5.4rem)] z-40 animate-fade-in md:hidden">
      <div className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-background/95 p-3 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Sparkles className="size-5" />
        </span>
        <Link to="/build-box" className="min-w-0 flex-1" onClick={() => setShow(false)}>
          <p className="truncate text-sm font-semibold">
            {lang === "ta" ? "உங்கள் பெட்டியை உருவாக்குங்கள்" : "Build your own box now"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {lang === "ta"
              ? "பட்ஜெட்டுக்கு ஏற்ப தேர்வு செய்யுங்கள்"
              : "Pick by budget, category by category"}
          </p>
        </Link>
        <button
          aria-label="Dismiss"
          className="shrink-0 rounded-full p-1 text-muted-foreground"
          onClick={() => setDismissed(true)}
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCart, useSource } from "@/lib/enquiry-cart";
import { useLang } from "@/lib/i18n";
import { LEGAL_NOTICE, LEGAL_NOTICE_TA, SAFETY_NOTICE, SHOP } from "@/lib/shop";

const NAV = [
  { to: "/catalogue", label: "Catalogue", labelTa: "அட்டவணை" },
  { to: "/build-box", label: "Build My Box", labelTa: "என் பெட்டி" },
  { to: "/combos", label: "Combos", labelTa: "காம்போ" },
  { to: "/track", label: "Track", labelTa: "நிலை" },
] as const;

const TABS = [
  { to: "/", label: "Home", labelTa: "முகப்பு", icon: Home },
  { to: "/catalogue", label: "Catalogue", labelTa: "அட்டவணை", icon: Grid2x2 },
  { to: "/combos", label: "Combos", labelTa: "காம்போ", icon: Gift },
  { to: "/build-box", label: "My Box", labelTa: "என் பெட்டி", icon: Sparkles },
] as const;

export function LegalNotice({ compact = false }: { compact?: boolean }) {
  const { lang } = useLang();
  return (
    <div
      className={`rounded-xl border border-border bg-accent/60 px-4 py-3 text-accent-foreground ${
        compact ? "text-[11px] leading-relaxed" : "text-xs leading-relaxed"
      }`}
    >
      <p>{lang === "ta" ? LEGAL_NOTICE_TA : LEGAL_NOTICE}</p>
      {!compact && <p className="mt-2 opacity-80">{SAFETY_NOTICE}</p>}
    </div>
  );
}

function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex items-center rounded-full border border-border p-0.5 text-xs">
      <button
        onClick={() => setLang("ta")}
        className={`rounded-full px-2.5 py-1 ${lang === "ta" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
      >
        தமிழ்
      </button>
      <button
        onClick={() => setLang("en")}
        className={`rounded-full px-2.5 py-1 ${lang === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
      >
        EN
      </button>
    </div>
  );
}

function CartButton({ count }: { count: number }) {
  return (
    <Link
      to="/enquiry"
      aria-label="My enquiry"
      className="relative grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
    >
      <ShoppingCart className="size-5" />
      {count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
          {count}
        </span>
      )}
    </Link>
  );
}

export function SiteShell({
  children,
  showFooter = false,
}: {
  children: ReactNode;
  showFooter?: boolean;
}) {
  const { count } = useCart();
  const { lang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  useSource();

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <div className="bg-accent/70 px-4 py-2 text-center text-[11px] font-medium leading-snug text-accent-foreground">
        {t("announce")}
      </div>


      <header className="sticky top-0 z-40 rounded-b-3xl bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto w-full max-w-6xl px-4 pb-3 pt-3">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <button
                    aria-label="Menu"
                    className="grid size-9 shrink-0 place-items-center rounded-lg hover:bg-primary-foreground/10 md:hidden"
                  >
                    <Menu className="size-5" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-6">
                  <nav className="mt-8 flex flex-col gap-1">
                    {NAV.map((n) => (
                      <Link
                        key={n.to}
                        to={n.to}
                        onClick={() => setOpen(false)}
                        className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
                      >
                        {lang === "ta" ? n.labelTa : n.label}
                      </Link>
                    ))}
                    <a
                      href={`tel:${SHOP.phoneDial}`}
                      className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-accent"
                    >
                      {SHOP.phone}
                    </a>
                  </nav>
                </SheetContent>
              </Sheet>

              <Link to="/" className="flex min-w-0 items-center gap-2">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-foreground text-base">
                  🎇
                </span>
                <span className="truncate font-display text-base font-semibold tracking-tight">
                  {SHOP.name}
                </span>
              </Link>

              <nav className="ml-4 hidden items-center gap-1 md:flex">
                {NAV.map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    activeProps={{ className: "bg-primary-foreground/15" }}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  >
                    {lang === "ta" ? n.labelTa : n.label}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <LangToggle />
              <Link
                to="/track"
                aria-label="Track enquiry"
                className="hidden size-9 place-items-center rounded-full hover:bg-primary-foreground/10 sm:grid"
              >
                <Heart className="size-5" />
              </Link>
              <CartButton count={count} />
            </div>
          </div>

          <form
            className="relative mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              navigate({ to: "/catalogue", search: q.trim() ? { q: q.trim() } : {} });
            }}
          >
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search")}
              className="h-11 w-full rounded-full bg-background pl-11 pr-12 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              aria-label="Search"
              className="absolute right-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-primary text-primary-foreground"
            >
              <Search className="size-4" />
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0">{children}</main>

      {showFooter && (
        <footer className="mt-12 border-t border-border bg-background">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <h3 className="text-lg font-semibold">{SHOP.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{SHOP.tagline}</p>
              <p className="mt-3 text-sm text-muted-foreground">
                {SHOP.addressLines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </p>
            </div>
            <div className="text-sm">
              <h4 className="font-semibold">{t("contact")}</h4>
              <a
                href={`tel:${SHOP.phoneDial}`}
                className="mt-2 flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Phone className="size-4" /> {SHOP.phone}
              </a>
              <a
                href={`https://wa.me/${SHOP.whatsapp}`}
                className="mt-1 flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
              <p className="mt-2 text-muted-foreground">{SHOP.hours}</p>
              <p className="mt-2 text-muted-foreground">{SHOP.email}</p>
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <LegalNotice />
              <p className="mt-3 text-[11px] text-muted-foreground">{SHOP.licence}</p>
            </div>
          </div>
        </footer>
      )}

      <BoxNudge />

      <nav className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] md:hidden">
        <div className="grid h-16 grid-cols-5 rounded-[26px] border border-border/60 bg-background/70 shadow-[0_10px_30px_-12px_rgba(0,0,0,0.35)] backdrop-blur-xl backdrop-saturate-150">

          {TABS.map((tab) => (
            <Link
              key={tab.to}
              to={tab.to}
              search={{}}
              activeOptions={{ exact: tab.to === "/" }}
              activeProps={{ className: "text-primary" }}
              className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none text-muted-foreground"
            >
              <tab.icon className="size-5" />
              {lang === "ta" ? tab.labelTa : tab.label}
            </Link>
          ))}
          <Link
            to="/enquiry"
            activeProps={{ className: "text-primary" }}
            className="flex flex-col items-center justify-center gap-1 text-[11px] font-medium leading-none text-muted-foreground"
          >
            <span className="relative">
              <ShoppingCart className="size-5" />
              {count > 0 && (
                <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </span>
            {lang === "ta" ? "விசாரணை" : "Enquiry"}
          </Link>
        </div>
      </nav>

    </div>
  );
}
