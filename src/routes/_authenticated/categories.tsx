import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { EXPERIENCES } from "@/lib/catalog";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/categories")({
  head: () => ({
    meta: [
      { title: "Categories — Upcurv Crackers Seller Desk" },
      { name: "description", content: "Create and edit catalogue categories for the shop." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Categories — Upcurv Crackers Seller Desk" },
      { property: "og:description", content: "Manage category names, emoji, images and order." },
    ],
  }),
  component: CategoriesPage,
});

type Category = Tables<"categories">;
type Draft = Partial<Category> & { name: string; slug: string };

const EMPTY: Draft = { name: "", slug: "", name_ta: "", emoji: "🎇", experience: "sky", sort: 0, image_url: "" };

function CategoriesPage() {
  const qc = useQueryClient();
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("sort");
      if (error) throw error;
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      const payload: TablesInsert<"categories"> = {
        slug: d.slug.trim(),
        name: d.name.trim(),
        name_ta: d.name_ta || null,
        emoji: d.emoji || null,
        experience: d.experience || null,
        sort: Number(d.sort ?? 0),
        image_url: d.image_url || null,
      };
      const { error } = d.id
        ? await supabase.from("categories").update(payload).eq("id", d.id)
        : await supabase.from("categories").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /** Swap the sort value with the neighbour above/below. */
  const move = useMutation({
    mutationFn: async ({ index, dir }: { index: number; dir: -1 | 1 }) => {
      const list = data ?? [];
      const a = list[index];
      const b = list[index + dir];
      if (!a || !b) return;
      // Equal sort values would make the swap a no-op, so fall back to positions.
      const sortA = a.sort === b.sort ? index + dir : b.sort;
      const sortB = a.sort === b.sort ? index : a.sort;
      const results = await Promise.all([
        supabase.from("categories").update({ sort: sortA }).eq("id", a.id),
        supabase.from("categories").update({ sort: sortB }).eq("id", b.id),
      ]);
      const failed = results.find((r) => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Categories</h1>
        <Button className="ml-auto" onClick={() => setDraft({ ...EMPTY })}>
          <Plus className="size-4" /> New category
        </Button>
      </div>

      <div className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="shimmer h-16 w-full" />)}
        {(data ?? []).map((c, i, arr) => (
          <div key={c.id} className="flex items-center gap-3 p-3">
            <span className="text-xl">{c.emoji}</span>
            <button className="min-w-0 flex-1 text-left" onClick={() => setDraft(c)}>
              <p className="truncate text-sm font-semibold">{c.name}</p>
              <p className="text-xs text-muted-foreground">
                {c.slug} · {c.experience ?? "—"} · sort {c.sort}
              </p>
            </button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Move up"
              disabled={i === 0 || move.isPending}
              onClick={() => move.mutate({ index: i, dir: -1 })}
            >
              <ChevronUp className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Move down"
              disabled={i === arr.length - 1 || move.isPending}
              onClick={() => move.mutate({ index: i, dir: 1 })}
            >
              <ChevronDown className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (confirm(`Delete ${c.name}?`)) remove.mutate(c.id);
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit category" : "New category"}</DialogTitle>
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
                  <Label>Name*</Label>
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tamil name</Label>
                  <Input
                    value={draft.name_ta ?? ""}
                    onChange={(e) => setDraft({ ...draft, name_ta: e.target.value })}
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
                  <Label>Emoji</Label>
                  <Input
                    value={draft.emoji ?? ""}
                    onChange={(e) => setDraft({ ...draft, emoji: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Experience</Label>
                  <select
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={draft.experience ?? ""}
                    onChange={(e) => setDraft({ ...draft, experience: e.target.value })}
                  >
                    <option value="">—</option>
                    {EXPERIENCES.map((x) => (
                      <option key={x.key} value={x.key}>
                        {x.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Sort</Label>
                  <Input
                    type="number"
                    value={draft.sort ?? 0}
                    onChange={(e) => setDraft({ ...draft, sort: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                 <Label>Image link</Label>
                <Input
                   type="url"
                   placeholder="https://…"
                  value={draft.image_url ?? ""}
                  onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save category"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
