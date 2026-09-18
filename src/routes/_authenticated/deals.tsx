import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { inr } from "@/lib/shop";

type Product = Tables<"products">;

export const Route = createFileRoute("/_authenticated/deals")({
  head: () => ({
    meta: [
      { title: "Deal Store — Upcurv Crackers Seller Desk" },
      { name: "description", content: "Queue discounted deal picks shown on the enquiry page." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Deal Store — Upcurv Crackers Seller Desk" },
      { property: "og:description", content: "Add, edit and order the Deal Store picks." },
    ],
  }),
  component: DealsAdmin,
});

function DealsAdmin() {
  const qc = useQueryClient();
  const [picker, setPicker] = useState(false);
  const [edit, setEdit] = useState<Product | null>(null);
  const [dealPrice, setDealPrice] = useState("");
  const [search, setSearch] = useState("");

  const products = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("code");
      if (error) throw error;
      return data;
    },
  });

  const all = products.data ?? [];
  const deals = useMemo(
    () =>
      all
        .filter((p) => p.deal_rank != null)
        .sort((a, b) => Number(a.deal_rank) - Number(b.deal_rank)),
    [all],
  );
  const candidates = useMemo(
    () =>
      all
        .filter((p) => p.deal_rank == null && p.active)
        .filter((p) =>
          search
            ? `${p.name} ${p.code}`.toLowerCase().includes(search.toLowerCase())
            : true,
        )
        .slice(0, 40),
    [all, search],
  );

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const update = useMutation({
    mutationFn: async (rows: { id: string; deal_rank: number | null; deal_price?: number | null }[]) => {
      for (const r of rows) {
        const { error } = await supabase
          .from("products")
          .update(
            r.deal_price === undefined
              ? { deal_rank: r.deal_rank }
              : { deal_rank: r.deal_rank, deal_price: r.deal_price },
          )
          .eq("id", r.id);
        if (error) throw error;
      }
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const move = (index: number, dir: -1 | 1) => {
    const next = [...deals];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const a = next[index]!;
    const b = next[target]!;
    update.mutate([
      { id: a.id, deal_rank: target + 1 },
      { id: b.id, deal_rank: index + 1 },
    ]);
  };

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Deal Store</h1>
          <p className="text-sm text-muted-foreground">
            These picks show on the enquiry page in this order, at their deal price.
          </p>
        </div>
        <Button className="ml-auto" onClick={() => setPicker(true)}>
          <Plus className="size-4" /> Add deal pick
        </Button>
      </div>

      <div className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {products.isLoading &&
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-16 w-full" />)}
        {deals.map((p, i) => {
          const sellingPrice = Number(p.price);
          const mrp = p.mrp == null ? sellingPrice : Number(p.mrp);
          const dp = p.deal_price == null ? sellingPrice : Number(p.deal_price);
          const off = mrp > dp ? Math.round(((mrp - dp) / mrp) * 100) : 0;
          return (
            <div key={p.id} className="flex items-center gap-3 p-3">
              <span className="w-6 text-center text-sm font-semibold text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.code} · <span className="line-through">MRP {inr(mrp)}</span>{" "}
                  <span className="line-through">Sale {inr(sellingPrice)}</span>{" "}
                  <span className="font-semibold text-primary">Deal {inr(dp)}</span>{" "}
                  {off > 0 && <span className="text-emerald-600">{off}% off</span>}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => move(i, 1)}
                disabled={i === deals.length - 1}
              >
                <ArrowDown className="size-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setEdit(p);
                  setDealPrice(p.deal_price == null ? String(p.price) : String(p.deal_price));
                }}
              >
                Edit price
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  update.mutate([{ id: p.id, deal_rank: null, deal_price: null }], {
                    onSuccess: () => toast.success("Removed from Deal Store"),
                  })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        })}
        {!products.isLoading && deals.length === 0 && (
          <p className="p-6 text-center text-sm text-muted-foreground">
            No deal picks yet. Add one to fill the Deal Store strip.
          </p>
        )}
      </div>

      <Dialog open={picker} onOpenChange={setPicker}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Add a deal pick</DialogTitle>
          </DialogHeader>
          <Input
            placeholder="Search name or code"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-80 space-y-1 overflow-y-auto">
            {candidates.map((p) => (
              <button
                key={p.id}
                className="flex w-full items-center gap-2 rounded-xl border border-border p-2 text-left hover:bg-accent"
                onClick={() =>
                  update.mutate(
                    [{ id: p.id, deal_rank: deals.length + 1, deal_price: Number(p.price) }],
                    {
                      onSuccess: () => {
                        setPicker(false);
                        setEdit(p);
                        setDealPrice(String(p.price));
                      },
                    },
                  )
                }
              >
                <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                <span className="text-xs text-muted-foreground">{inr(Number(p.price))}</span>
              </button>
            ))}
            {candidates.length === 0 && (
              <p className="p-4 text-center text-xs text-muted-foreground">No products found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>{edit?.name}</DialogTitle>
          </DialogHeader>
          {edit && (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                update.mutate(
                  [
                    {
                      id: edit.id,
                      deal_rank: edit.deal_rank ?? deals.length + 1,
                      deal_price: dealPrice === "" ? null : Number(dealPrice),
                    },
                  ],
                  {
                    onSuccess: () => {
                      setEdit(null);
                      toast.success("Deal price published");
                    },
                  },
                );
              }}
            >
              <p className="text-xs text-muted-foreground">
                Normal price {inr(Number(edit.price))}
                {edit.mrp ? ` · MRP ${inr(Number(edit.mrp))}` : ""}
              </p>
              <div className="space-y-1.5">
                <Label>Deal price</Label>
                <Input
                  type="number"
                  min={0}
                  value={dealPrice}
                  onChange={(e) => setDealPrice(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={update.isPending}>
                {update.isPending ? "Saving…" : "Publish deal"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
