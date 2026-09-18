import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_SETTINGS_KEY, orderSettingsQuery } from "@/lib/settings";
import { inr } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Upcurv Crackers Seller Desk" },
      { name: "description", content: "Shop rules such as the minimum order value." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Settings — Upcurv Crackers Seller Desk" },
      { property: "og:description", content: "Configure enquiry rules for the storefront." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const settings = useQuery(orderSettingsQuery);
  const [minValue, setMinValue] = useState("0");

  useEffect(() => {
    if (settings.data) setMinValue(String(settings.data.min_order_value));
  }, [settings.data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("app_settings")
        .upsert(
          { key: ORDER_SETTINGS_KEY, value: { min_order_value: Number(minValue || 0) } },
          { onConflict: "key" },
        );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Settings saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell>
      <h1 className="text-xl font-semibold">Settings</h1>
      <p className="text-sm text-muted-foreground">Rules that apply to the public catalogue.</p>

      <section className="mt-5 max-w-xl rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="text-sm font-semibold">Minimum order value</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Customers cannot send an enquiry below this amount. Set 0 to switch the limit off.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="min">Amount (₹)</Label>
            <Input
              id="min"
              type="number"
              min={0}
              className="w-40"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
            />
          </div>
          <Button disabled={save.isPending} onClick={() => save.mutate()}>
            {save.isPending ? "Saving…" : "Save"}
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Currently live: <span className="font-semibold">{inr(settings.data?.min_order_value ?? 0)}</span>
        </p>
      </section>
    </AdminShell>
  );
}
