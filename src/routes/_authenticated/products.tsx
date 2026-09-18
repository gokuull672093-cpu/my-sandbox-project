import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Pencil, Plus, Search, Trash2, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { AdminShell } from "@/components/admin-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { Enums, TablesInsert } from "@/integrations/supabase/types";
import { BOX_TAGS, PROMO_TAGS, categoriesQuery, type Product } from "@/lib/catalog";
import { inr } from "@/lib/shop";

export const Route = createFileRoute("/_authenticated/products")({
  head: () => ({
    meta: [
      { title: "Products — Upcurv Crackers Seller Desk" },
      { name: "description", content: "Add and edit catalogue products, prices and availability." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Products — Upcurv Crackers Seller Desk" },
      { property: "og:description", content: "Manage the shop catalogue." },
    ],
  }),
  component: ProductsAdmin,
});

const AVAILABILITY: Enums<"availability_status">[] = [
  "available",
  "limited",
  "unavailable",
  "enquiry_only",
];

type Draft = {
  id?: string;
  code: string;
  name: string;
  name_ta: string;
  category_id: string;
  pack: string;
  mrp: string;
  price: string;
  availability: Enums<"availability_status">;
  image_url: string;
  tags: string[];
  active: boolean;
  addon_rank: string;
  deal_rank: string;
  deal_price: string;
  popular_rank: string;
};

const emptyDraft = (): Draft => ({
  code: "",
  name: "",
  name_ta: "",
  category_id: "",
  pack: "",
  mrp: "",
  price: "",
  availability: "available",
  image_url: "",
  tags: [],
  active: true,
  addon_rank: "",
  deal_rank: "",
  deal_price: "",
  popular_rank: "",
});

const toDraft = (p: Product): Draft => ({
  id: p.id,
  code: p.code,
  name: p.name,
  name_ta: p.name_ta ?? "",
  category_id: p.category_id ?? "",
  pack: p.pack ?? "",
  mrp: p.mrp == null ? "" : String(p.mrp),
  price: String(p.price),
  availability: p.availability,
  image_url: p.image_url ?? "",
  tags: p.tags ?? [],
  active: p.active,
  addon_rank: p.addon_rank == null ? "" : String(p.addon_rank),
  deal_rank: p.deal_rank == null ? "" : String(p.deal_rank),
  deal_price: p.deal_price == null ? "" : String(p.deal_price),
  popular_rank: p.popular_rank == null ? "" : String(p.popular_rank),
});


type ImportRow = {
  code: string;
  name: string;
  name_ta: string | null;
  pack: string | null;
  price: number;
  mrp: number | null;
  category: string;
  availability: Enums<"availability_status">;
};

const AVAILABILITY_TONE: Record<string, string> = {
  available: "border-report-green/25 bg-report-green/10 text-report-green",
  limited: "border-amber-300 bg-amber-100 text-amber-700",
  unavailable: "border-report-rose/25 bg-report-rose/10 text-report-rose",
  enquiry_only: "border-report-blue/25 bg-report-blue/10 text-report-blue",
};

const AVAIL_SET = new Set(AVAILABILITY as string[]);

function pick(row: Record<string, unknown>, keys: string[]) {
  for (const k of Object.keys(row)) {
    const norm = k.trim().toLowerCase().replace(/[\s_-]+/g, "");
    if (keys.includes(norm)) {
      const v = row[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
    }
  }
  return "";
}

function ProductsAdmin() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [importRows, setImportRows] = useState<ImportRow[] | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  /** Stores the photo in the product-images bucket and keeps a long-lived link. */
  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const up = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "31536000",
        upsert: false,
      });
      if (up.error) throw up.error;
      const signed = await supabase.storage
        .from("product-images")
        .createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      if (signed.error) throw signed.error;
      setDraft((d) => (d ? { ...d, image_url: signed.data.signedUrl } : d));
      toast.success("Photo uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const categories = useQuery(categoriesQuery);
  const products = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("code");
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["admin", "products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const save = useMutation({
    mutationFn: async (d: Draft) => {
      // A deal price only makes sense when it is cheaper than the normal price.
      if (d.deal_price !== "" && Number(d.deal_price) >= Number(d.price || 0)) {
        throw new Error("Deal price must be less than the selling price.");
      }
      const payload: TablesInsert<"products"> = {
        code: d.code.trim().toUpperCase(),
        name: d.name.trim(),
        name_ta: d.name_ta.trim() || null,
        category_id: d.category_id || null,
        pack: d.pack.trim() || null,
        mrp: d.mrp === "" ? null : Number(d.mrp),
        price: Number(d.price || 0),
        availability: d.availability,
        image_url: d.image_url.trim() || null,
        tags: d.tags,
        active: d.active,
        addon_rank: d.addon_rank === "" ? null : Number(d.addon_rank),
        deal_rank: d.deal_rank === "" ? null : Number(d.deal_rank),
        popular_rank: d.popular_rank === "" ? null : Number(d.popular_rank),
        deal_price: d.deal_price === "" ? null : Number(d.deal_price),

      };
      const res = d.id
        ? await supabase.from("products").update(payload).eq("id", d.id)
        : await supabase.from("products").insert(payload);
      if (res.error) throw res.error;
    },
    onSuccess: () => {
      toast.success("Product saved");
      setDraft(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("products").update({ active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      invalidate();
    },
    onError: () => toast.error("Product is used in an enquiry or combo — deactivate it instead."),
  });

  const parseFile = async (file: File) => {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]!]!;
      const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
      const errors: string[] = [];
      const parsed: ImportRow[] = [];

      raw.forEach((r, i) => {
        const code = pick(r, ["code", "productcode", "sku", "itemcode"]).toUpperCase();
        const name = pick(r, ["name", "productname", "item", "description"]);
        const price = Number(pick(r, ["price", "sellingprice", "rate", "offerprice"]) || 0);
        if (!code || !name) {
          errors.push(`Row ${i + 2}: missing code or name — skipped`);
          return;
        }
        const availability = pick(r, ["availability", "stock", "status"])
          .toLowerCase()
          .replace(/[\s-]+/g, "_");
        const mrpRaw = pick(r, ["mrp", "listprice", "actualprice"]);
        parsed.push({
          code,
          name,
          name_ta: pick(r, ["nameta", "tamilname", "tamil"]) || null,
          pack: pick(r, ["pack", "packing", "unit", "qtyperpack"]) || null,
          price,
          mrp: mrpRaw ? Number(mrpRaw) : null,
          category: pick(r, ["category", "categoryname", "group"]),
          availability: (AVAIL_SET.has(availability)
            ? availability
            : "available") as Enums<"availability_status">,
        });
      });

      if (parsed.length === 0) {
        toast.error("No usable rows found. Check the column names.");
        return;
      }
      setImportErrors(errors);
      setImportRows(parsed);
    } catch {
      toast.error("Could not read that file. Use .xlsx, .xls or .csv.");
    }
  };

  const runImport = useMutation({
    mutationFn: async (rows: ImportRow[]) => {
      const cats = categories.data ?? [];
      const bySlug = new Map(cats.map((c) => [c.name.trim().toLowerCase(), c.id]));
      const payload: TablesInsert<"products">[] = rows.map((r) => ({
        code: r.code,
        name: r.name,
        name_ta: r.name_ta,
        pack: r.pack,
        price: r.price,
        mrp: r.mrp,
        category_id: bySlug.get(r.category.trim().toLowerCase()) ?? null,
        availability: r.availability,
        active: true,
      }));
      const { error } = await supabase
        .from("products")
        .upsert(payload, { onConflict: "code" });
      if (error) throw error;
      return payload.length;
    },
    onSuccess: (n) => {
      toast.success(`${n} products imported`);
      setImportRows(null);
      setImportErrors([]);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const downloadTemplate = () => {
    const csv =
      "code,name,name_ta,category,pack,price,mrp,availability\nCRK-101,Sparkler 10cm,ஸ்பார்க்லர்,Sparklers,1 box (10 pcs),120,180,available\n";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "upcurv-products-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const catName = useMemo(
    () => Object.fromEntries((categories.data ?? []).map((c) => [c.id, c.name])),
    [categories.data],
  );

  const rows = (products.data ?? []).filter((p) => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return (
      p.name.toLowerCase().includes(needle) ||
      p.code.toLowerCase().includes(needle) ||
      (p.name_ta ?? "").toLowerCase().includes(needle)
    );
  });

  return (
    <AdminShell>
      <div className="flex flex-wrap items-center gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground">
            {products.data?.length ?? 0} items in the catalogue
          </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name or code"
              className="w-56 pl-8"
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void parseFile(f);
              e.target.value = "";
            }}
          />
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            <Upload className="size-4" /> Import Excel
          </Button>
          <Button onClick={() => setDraft(emptyDraft())}>
            <Plus className="size-4" /> Add product
          </Button>
        </div>
      </div>

      <Dialog
        open={!!importRows}
        onOpenChange={(o) => {
          if (!o) {
            setImportRows(null);
            setImportErrors([]);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Import preview</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {importRows?.length ?? 0} products ready. Existing products with the same code are
            updated; new codes are added.
          </p>
          {importErrors.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              {importErrors.slice(0, 5).map((e) => (
                <p key={e}>{e}</p>
              ))}
              {importErrors.length > 5 && <p>+{importErrors.length - 5} more skipped rows</p>}
            </div>
          )}
          <div className="max-h-72 overflow-auto rounded-lg border border-border">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 bg-muted">
                <tr>
                  <th className="p-2">Code</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Category</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">MRP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(importRows ?? []).slice(0, 100).map((r) => (
                  <tr key={r.code}>
                    <td className="p-2 font-medium">{r.code}</td>
                    <td className="p-2">{r.name}</td>
                    <td className="p-2 text-muted-foreground">{r.category || "—"}</td>
                    <td className="p-2 text-right">{r.price}</td>
                    <td className="p-2 text-right">{r.mrp ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={downloadTemplate}>
              <Download className="size-4" /> Template
            </Button>
            <Button variant="outline" onClick={() => setImportRows(null)}>
              Cancel
            </Button>
            <Button
              disabled={runImport.isPending}
              onClick={() => importRows && runImport.mutate(importRows)}
            >
              {runImport.isPending ? "Importing…" : `Import ${importRows?.length ?? 0} products`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
        {products.isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {rows.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <img
                  src={p.image_url || "/favicon.ico"}
                  alt={p.name}
                  className="h-11 w-14 shrink-0 rounded-md border border-border object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.code} · {catName[p.category_id ?? ""] ?? "No category"} · {p.pack ?? "—"}
                  </p>
                </div>
                <span className="w-20 text-right text-sm font-semibold">{inr(p.price)}</span>
                <span
                  className={`hidden rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize sm:block ${
                    AVAILABILITY_TONE[p.availability]
                  }`}
                >
                  {p.availability.replace("_", " ")}
                </span>
                <Switch
                  checked={p.active}
                  onCheckedChange={(v) => toggleActive.mutate({ id: p.id, active: v })}
                />
                <Button size="icon" variant="ghost" onClick={() => setDraft(toDraft(p))}>
                  <Pencil className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => remove.mutate(p.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            {rows.length === 0 && (
              <p className="p-8 text-center text-sm text-muted-foreground">No products found.</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit product" : "Add product"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Code*</Label>
                <Input
                  value={draft.code}
                  onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Pack</Label>
                <Input
                  value={draft.pack}
                  placeholder="1 box (10 pcs)"
                  onChange={(e) => setDraft({ ...draft, pack: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Name*</Label>
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Tamil name</Label>
                <Input
                  value={draft.name_ta}
                  onChange={(e) => setDraft({ ...draft, name_ta: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Price*</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>MRP</Label>
                <Input
                  type="number"
                  min={0}
                  value={draft.mrp}
                  onChange={(e) => setDraft({ ...draft, mrp: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select
                  value={draft.category_id}
                  onValueChange={(v) => setDraft({ ...draft, category_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories.data ?? []).map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Availability</Label>
                <Select
                  value={draft.availability}
                  onValueChange={(v) =>
                    setDraft({ ...draft, availability: v as Enums<"availability_status"> })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABILITY.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Product photo</Label>
                <div className="flex items-center gap-3">
                  {draft.image_url && (
                    <img
                      src={draft.image_url}
                      alt=""
                      className="h-14 w-20 shrink-0 rounded-md border border-border object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <Input
                      value={draft.image_url}
                      placeholder="Paste an image link, or upload below"
                      onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        ref={imageRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void uploadImage(file);
                          e.target.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={uploading}
                        onClick={() => imageRef.current?.click()}
                      >
                        <Upload className="size-4" />
                        {uploading ? "Uploading…" : "Upload from device"}
                      </Button>
                      {draft.image_url && (
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setDraft({ ...draft, image_url: "" })}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border p-3 sm:col-span-2">
                <p className="text-sm font-semibold">Enquiry page placement</p>
                <p className="text-xs text-muted-foreground">
                  Leave a position blank to hide the product from that strip. Lower number appears
                  first.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Add-on position</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="—"
                      value={draft.addon_rank}
                      onChange={(e) => setDraft({ ...draft, addon_rank: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deal position</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="—"
                      value={draft.deal_rank}
                      onChange={(e) => setDraft({ ...draft, deal_rank: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Deal price</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="—"
                      value={draft.deal_price}
                      onChange={(e) => setDraft({ ...draft, deal_price: e.target.value })}
                    />
                    <p
                      className={`text-[11px] ${
                        draft.deal_price !== "" &&
                        Number(draft.deal_price) >= Number(draft.price || 0)
                          ? "font-medium text-report-rose"
                          : "text-muted-foreground"
                      }`}
                    >
                      Must be lower than the selling price
                      {draft.price ? ` (${inr(Number(draft.price))})` : ""}.
                    </p>
                  </div>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label>Home popular position</Label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="—"
                      value={draft.popular_rank}
                      onChange={(e) => setDraft({ ...draft, popular_rank: e.target.value })}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Set a number to show this product in “Popular” on the home page.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {BOX_TAGS.map((tg) => {
                    const on = draft.tags.includes(tg.key);
                    return (
                      <button
                        key={tg.key}
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            tags: on
                              ? draft.tags.filter((t) => t !== tg.key)
                              : [...draft.tags, tg.key],
                          })
                        }
                        className={`rounded-full border px-3 py-1 text-xs ${
                          on ? "border-primary bg-primary text-primary-foreground" : "border-border"
                        }`}
                      >
                        {tg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Promotion badges</Label>
                <p className="text-[11px] text-muted-foreground">
                  Shown on the product card to attract customers.
                </p>
                <div className="flex flex-wrap gap-2">
                  {PROMO_TAGS.map((tg) => {
                    const on = draft.tags.includes(tg.key);
                    return (
                      <button
                        key={tg.key}
                        type="button"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            tags: on
                              ? draft.tags.filter((t) => t !== tg.key)
                              : [...draft.tags, tg.key],
                          })
                        }
                        className={`cursor-pointer rounded-full border px-3 py-1 text-xs ${
                          on
                            ? "border-report-violet bg-report-violet text-white"
                            : "border-border"
                        }`}
                      >
                        {tg.emoji} {tg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <Switch
                  checked={draft.active}
                  onCheckedChange={(v) => setDraft({ ...draft, active: v })}
                />
                Visible in the public catalogue
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              Cancel
            </Button>
            <Button
              disabled={save.isPending}
              onClick={() => {
                if (!draft) return;
                if (!draft.code.trim() || !draft.name.trim() || draft.price === "") {
                  toast.error("Code, name and price are required.");
                  return;
                }
                save.mutate(draft);
              }}
            >
              {save.isPending ? "Saving…" : "Save product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminShell>
  );
}
