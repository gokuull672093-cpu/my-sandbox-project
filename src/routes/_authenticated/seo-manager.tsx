import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { logAudit } from "@/lib/audit";
import {
  EMPTY_SEO,
  SEO_SETTINGS_KEY,
  buildRobotsTxt,
  buildSitemapXml,
  seoSettingsQuery,
  type SeoSettings,
} from "@/lib/seo-settings";

export const Route = createFileRoute("/_authenticated/seo-manager")({
  head: () => ({
    meta: [
      { title: "Search & Sharing — Upcurv Crackers Seller Desk" },
      {
        name: "description",
        content: "Set the page title, description, keywords, favicon and share image.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Search & Sharing — Upcurv Crackers Seller Desk" },
      { property: "og:description", content: "Search engine details for the shop." },
    ],
  }),
  component: SeoManagerPage,
});

function CopyBox({ title, hint, text }: { title: string; hint: string; text: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-[11px] text-muted-foreground">{hint}</p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="ml-auto"
          onClick={() => {
            void navigator.clipboard.writeText(text);
            toast.success("Copied");
          }}
        >
          Copy
        </Button>
      </div>
      <pre className="mt-3 max-h-56 overflow-auto rounded-lg bg-muted p-3 text-[11px] leading-relaxed">
        {text}
      </pre>
    </div>
  );
}

function SeoManagerPage() {
  const qc = useQueryClient();
  const saved = useQuery(seoSettingsQuery);
  const [form, setForm] = useState<SeoSettings>(EMPTY_SEO);

  useEffect(() => {
    if (saved.data) setForm(saved.data);
  }, [saved.data]);

  const save = useMutation({
    mutationFn: async (value: SeoSettings) => {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: SEO_SETTINGS_KEY, value }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings", SEO_SETTINGS_KEY] });
      toast.success("Search details saved");
      void logAudit({
        entity: "settings",
        action: "update",
        entityLabel: "Search & sharing",
        detail: "SEO details updated",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field = (
    key: keyof SeoSettings,
    label: string,
    hint: string,
    placeholder = "",
    long = false,
  ) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {long ? (
        <Textarea
          rows={3}
          value={form[key]}
          placeholder={placeholder}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      ) : (
        <Input
          value={form[key]}
          placeholder={placeholder}
          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        />
      )}
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );

  return (
    <AdminShell>
      <h1 className="text-xl font-semibold">Search & sharing</h1>
      <p className="text-sm text-muted-foreground">
        These details decide how the shop appears on Google and when the link is shared on WhatsApp.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-border bg-card p-4">
          {field(
            "site_title",
            "Page title",
            "Keep it under 60 characters, with your shop name and main keyword.",
            "Upcurv Crackers — Sivakasi Diwali Crackers Catalogue",
          )}
          {field(
            "description",
            "Description",
            "Under 160 characters. This is the grey text shown under the title on Google.",
            "Browse our Diwali crackers catalogue and send an enquiry — we confirm price and availability on call.",
            true,
          )}
          {field(
            "keywords",
            "Keywords",
            "Comma separated, e.g. sivakasi crackers, diwali crackers price list, cracker gift box.",
            "sivakasi crackers, diwali crackers, cracker gift box",
          )}
          {field(
            "base_url",
            "Website address",
            "Used to build the sitemap and robots file below.",
            "https://yourshop.com",
          )}
          {field(
            "og_image",
            "Share image link",
            "1200x630 image shown when the link is shared. Use a full https link.",
            "https://…/share.jpg",
          )}
          {field("favicon_url", "Favicon link", "Small icon shown in the browser tab.", "https://…/icon.png")}
          {field("twitter_handle", "X / Twitter handle", "Optional.", "@upcurv")}

          <Button
            className="w-full"
            disabled={save.isPending}
            onClick={() => save.mutate(form)}
          >
            {save.isPending ? "Saving…" : "Save search details"}
          </Button>
        </section>

        <div className="space-y-4">
          <CopyBox
            title="robots.txt"
            hint="Copy this into the file public/robots.txt in the code."
            text={buildRobotsTxt(form.base_url)}
          />
          <CopyBox
            title="sitemap.xml"
            hint="Copy this into a new file public/sitemap.xml in the code."
            text={buildSitemapXml(form.base_url || "https://yourshop.com")}
          />
          <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            This page has no menu link on purpose — reach it only at{" "}
            <span className="font-mono text-foreground">/seo-manager</span>. Only a signed-in seller
            can open it.
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
