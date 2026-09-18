import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  BellRing,
  Gift,
  ListChecks,
  Package,
  PlusCircle,
  StickyNote,
  TicketPercent,
  Zap,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell";

export const Route = createFileRoute("/_authenticated/guide")({
  head: () => ({
    meta: [
      { title: "Guide — Upcurv Crackers Seller Desk" },
      { name: "description", content: "How to use the enquiry management platform day to day." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Guide — Upcurv Crackers Seller Desk" },
      { property: "og:description", content: "Step-by-step help for the shop team." },
    ],
  }),
  component: Guide,
});

const FLOW = [
  "Customer browses the catalogue and adds items to an enquiry.",
  "The enquiry lands here as New, with items, value and contact details.",
  "You call or WhatsApp the customer to confirm stock and final price.",
  "Move it through Contacted → Discussion → Confirmed as the deal progresses.",
  "Mark Ready when packed, and Completed after pickup or delivery.",
];

const SECTIONS = [
  {
    icon: ListChecks,
    title: "Enquiries",
    body: "Switch between grid and board view. Coloured badges show the stage, and Call / WhatsApp buttons open straight from the card. Open any card to edit quantities, prices and convert it into an order.",
  },
  {
    icon: BellRing,
    title: "Follow-ups",
    body: "Every enquiry with a reminder date appears here, split into Overdue, Today and Upcoming. Reschedule with the date box or mark it done.",
  },
  {
    icon: PlusCircle,
    title: "New enquiry",
    body: "For walk-in or phone customers: enter their details, choose where they came from, add products, and save. It joins the same pipeline.",
  },
  {
    icon: Package,
    title: "Products",
    body: "Add items one by one, or import your whole price list from an Excel or CSV file. Columns: code, name, price, mrp, pack, category, availability.",
  },
  {
    icon: Gift,
    title: "Combos",
    body: "Build gift boxes by picking products per category. The customer sees the total value, the combo price and the saving.",
  },
  {
    icon: Zap,
    title: "Deal Store",
    body: "Queue discounted picks shown on the enquiry page. MRP and normal price appear struck out next to the deal price.",
  },
  {
    icon: TicketPercent,
    title: "Coupons",
    body: "Percent or flat discounts with a minimum bill, cap and expiry. Customers apply them on the enquiry page.",
  },
  {
    icon: BarChart3,
    title: "Reports",
    body: "Visitors, cart adds, conversion, revenue and pipeline splits over 7, 30 or 90 days. Each card shows the change against the previous period.",
  },
  {
    icon: StickyNote,
    title: "Sticky notes & clock",
    body: "The note icon in the top bar keeps quick reminders on this device. The clock shows the current shop time.",
  },
];

function Guide() {
  return (
    <AdminShell>
      <h1 className="text-xl font-semibold">How to use this platform</h1>
      <p className="text-sm text-muted-foreground">
        Upcurv is a digital catalogue and enquiry desk — not an online store. Nothing is charged
        online; you confirm every order yourself.
      </p>

      <section className="mt-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">The daily flow</h2>
        <ol className="mt-3 space-y-3">
          {FLOW.map((step, i) => (
            <li key={step} className="flex gap-3 text-sm">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-report-blue/10 text-xs font-semibold text-report-blue">
                {i + 1}
              </span>
              <span className="text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {SECTIONS.map((s) => (
          <section key={s.title} className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-report-violet/10">
                <s.icon className="size-4 text-report-violet" />
              </span>
              <h2 className="text-sm font-semibold">{s.title}</h2>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>

      <section className="mt-5 rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Where the shop details live in the code</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Shop name, phone numbers, address, logo and legal lines are fixed in the code (not in
          Settings) so they can never be changed by mistake. Ask your developer to edit these files:
        </p>
        <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
          <li>
            <span className="font-mono text-foreground">src/lib/shop.ts</span> — shop name, tagline,
            WhatsApp and call numbers, email, full address, licence line, safety notice, UPI details.
          </li>
          <li>
            <span className="font-mono text-foreground">src/assets/</span> — logo, hero picture and
            category icons.
          </li>
          <li>
            <span className="font-mono text-foreground">public/favicon.ico</span> and{" "}
            <span className="font-mono text-foreground">public/robots.txt</span> — browser tab icon
            and search engine rules.
          </li>
          <li>
            <span className="font-mono text-foreground">src/styles.css</span> — brand colours.
          </li>
          <li>
            <span className="font-mono text-foreground">db/setup.sql</span> — one file that builds a
            complete, empty database for a brand-new store. Run it once in a fresh Supabase project
            and the whole platform works.
          </li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Page title, description, keywords, favicon link and share image can be changed by you at{" "}
          <span className="font-mono text-foreground">/seo-manager</span> — it has no menu link and
          only a signed-in seller can open it.
        </p>
      </section>



      <p className="mt-6 text-sm text-muted-foreground">
        Start from the{" "}
        <Link to="/dashboard" className="font-semibold text-report-blue">
          dashboard
        </Link>{" "}
        each morning: clear pending calls, then work your follow-ups.
      </p>
    </AdminShell>
  );
}
