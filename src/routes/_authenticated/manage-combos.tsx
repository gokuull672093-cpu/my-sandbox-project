import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";
import { inr } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/manage-combos")({
  head: () => ({
    meta: [
      { title: "Combos — Upcurv Crackers Seller Desk" },
      { name: "description", content: "Create and edit combo gift boxes and their items." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Combos — Upcurv Crackers Seller Desk" },
      { property: "og:description", content: "Manage combo pricing, images and product lists." },
    ],
  }),
  component: CombosAdmin,
});

type Combo = Tables<"combos">;
type Draft = Partial<Combo> & { title: string; slug: string };

const EMPTY: Draft = {
  title: "",
  slug: "",
  title_ta: "",
  description: "",
  indicative_price: 0,
  image_url: "",
  active: true,
};

function CombosAdmin() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [itemsFor, setItemsFor] = useState<Combo | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "combos"],
    queryFn: async () => {
      const { data, error } = await supabase.from("combos").select("*").order("created_at");
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "combos"] });
    qc.invalidateQueries({ queryKey: ["combos"] });
  };

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload: TablesInsert<"combos"> = {
        slug: d.slug.trim(),
        title: d.title.trim(),
        title_ta: d.title_ta || null,
        description: d.description || null,
        indicative_price: Number(d.indicative_price ?? 0),
        image_url: d.image_url || null,
        active: d.active ?? true,
      };
      const { error } = d.id
        ? await supabase.from("combos").update(payload).eq("id", d.id)
        : await supabase.from("combos").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft(null);
      invalidate();
      toast.success("Combo saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("combos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Combos</h1>
        <Button className="ml-auto" onClick={() => setDraft({ ...EMPTY })}>
          <Plus className="size-4" /> New combo
        </Button>
      </div>

      <div className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading &&
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-16 w-full" />)}
        {(data ?? []).map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3">
            <button className="min-w-0 flex-1 text-left" onClick={() => setDraft(c)}>
              <p className="truncate text-sm font-semibold">{c.title}</p>
              <p className="text-xs text-muted-foreground">
                {c.slug} · {inr(Number(c.indicative_price))} · {c.active ? "active" : "hidden"}
              </p>
            </button>
            <Button variant="secondary" size="sm" onClick={() => setItemsFor(c)}>
              Items
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm(`Delete ${c.title}?`)) remove.mutate(c.id);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[85vh] w-[calc(100vw-2rem)] max-w-md overflow-y-auto rounded-3xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit combo" : "New combo"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                save.mutate(draft);
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Title*</Label>
                  <Input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tamil title</Label>
                  <Input
                    value={draft.title_ta ?? ""}
                    onChange={(e) => setDraft({ ...draft, title_ta: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Slug*</Label>
                  <Input
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Indicative price</Label>
                  <Input
                    type="number"
                    value={draft.indicative_price ?? 0}
                    onChange={(e) =>
                      setDraft({ ...draft, indicative_price: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea
                  value={draft.description ?? ""}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Image URL</Label>
                <Input
                  value={draft.image_url ?? ""}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.active ?? true}
                  onChange={(e) => setDraft({ ...draft, active: e.target.checked })}
                />
                Active on storefront
              </label>
              <Button type="submit" className="w-full" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save combo"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemsFor} onOpenChange={(o) => !o && setItemsFor(null)}>
        <DialogContent className="flex max-h-[85vh] w-[calc(100vw-2rem)] max-w-lg flex-col overflow-hidden rounded-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{itemsFor?.title} · items</DialogTitle>
          </DialogHeader>
          <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
            {itemsFor && (
              <ComboItems comboId={itemsFor.id} price={Number(itemsFor.indicative_price)} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}

function ComboItems({ comboId, price }: { comboId: string; price: number }) {
  const qc = useQueryClient();
  const [categoryId, setCategoryId] = useState("");
  const [search, setSearch] = useState("");

  const categories = useQuery({
    queryKey: ["admin", "categories", "min"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,name").order("sort");
      if (error) throw error;
      return data;
    },
  });

  const products = useQuery({
    queryKey: ["admin", "products", "builder"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,code,price,mrp,category_id")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const items = useQuery({
    queryKey: ["admin", "combo-items", comboId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("combo_items")
        .select("id,qty,product_id,products(name,code,price,mrp)")
        .eq("combo_id", comboId);
      if (error) throw error;
      return data;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin", "combo-items", comboId] });
    qc.invalidateQueries({ queryKey: ["combos"] });
  };

  const upsert = useMutation({
    mutationFn: async (v: { productId: string; qty: number; id?: string }) => {
      if (v.id) {
        const { error } =
          v.qty <= 0
            ? await supabase.from("combo_items").delete().eq("id", v.id)
            : await supabase.from("combo_items").update({ qty: v.qty }).eq("id", v.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("combo_items")
        .insert({ combo_id: comboId, product_id: v.productId, qty: v.qty });
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: (e: Error) => toast.error(e.message),
  });

  const list = items.data ?? [];
  const byProduct = new Map(list.map((it) => [it.product_id, it]));

  const actualValue = list.reduce(
    (s, it) => s + Number(it.products?.mrp ?? it.products?.price ?? 0) * it.qty,
    0,
  );
  const listValue = list.reduce((s, it) => s + Number(it.products?.price ?? 0) * it.qty, 0);
  const saved = actualValue - price;
  const savedPct = actualValue > 0 ? Math.round((saved / actualValue) * 100) : 0;

  const pool = (products.data ?? [])
    .filter((p) => (categoryId ? p.category_id === categoryId : true))
    .filter((p) =>
      search ? `${p.name} ${p.code}`.toLowerCase().includes(search.toLowerCase()) : true,
    )
    .slice(0, 60);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Items total (actual value)</span>
          <span className="font-semibold">{inr(actualValue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Sum of selling prices</span>
          <span>{inr(listValue)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Combo price</span>
          <span className="font-semibold text-primary">{inr(price)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-border pt-1">
          <span className="text-muted-foreground">Customer saves</span>
          <span className={saved > 0 ? "font-semibold text-emerald-600" : "text-destructive"}>
            {inr(Math.max(0, saved))} {saved > 0 ? `· ${savedPct}%` : ""}
          </span>
        </div>
      </div>

      <div className="divide-y divide-border rounded-xl border border-border">
        {items.isLoading && <div className="shimmer h-12 w-full" />}
        {list.map((it) => (
          <div key={it.id} className="flex items-center gap-2 p-2 text-sm">
            <span className="min-w-0 flex-1 truncate">{it.products?.name ?? it.product_id}</span>
            <span className="text-xs text-muted-foreground">
              {inr(Number(it.products?.price ?? 0) * it.qty)}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => upsert.mutate({ productId: it.product_id, qty: it.qty - 1, id: it.id })}
            >
              −
            </Button>
            <span className="w-5 text-center font-semibold">{it.qty}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => upsert.mutate({ productId: it.product_id, qty: it.qty + 1, id: it.id })}
            >
              +
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => upsert.mutate({ productId: it.product_id, qty: 0, id: it.id })}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {!items.isLoading && list.length === 0 && (
          <p className="p-3 text-center text-xs text-muted-foreground">No items yet</p>
        )}
      </div>

      <div className="space-y-2 rounded-xl border border-border p-2">
        <p className="text-xs font-semibold text-muted-foreground">Add products by category</p>
        <div className="flex gap-2">
          <select
            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All categories</option>
            {(categories.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <Input
            className="h-9 w-32"
            placeholder="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {pool.map((p) => {
            const existing = byProduct.get(p.id);
            return (
              <button
                key={p.id}
                className="flex w-full items-center gap-2 rounded-lg border border-border p-2 text-left text-sm hover:bg-accent"
                onClick={() =>
                  upsert.mutate({
                    productId: p.id,
                    qty: (existing?.qty ?? 0) + 1,
                    ...(existing ? { id: existing.id } : {}),
                  })
                }
              >
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <span className="text-xs text-muted-foreground">{inr(Number(p.price))}</span>
                {existing && (
                  <span className="text-xs font-semibold text-primary">×{existing.qty}</span>
                )}
                <Plus className="size-4 shrink-0" />
              </button>
            );
          })}
          {pool.length === 0 && (
            <p className="p-3 text-center text-xs text-muted-foreground">No products</p>
          )}
        </div>
      </div>
    </div>
  );
}
