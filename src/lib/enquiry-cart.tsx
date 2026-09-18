import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  code: string;
  name: string;
  nameTa: string | null;
  price: number;
  mrp?: number | null;
  qty: number;
  categorySlug: string | null;
  imageUrl?: string | null;
  /** "combo" lines represent a whole gift box, not a single product */
  kind?: "product" | "combo";
  comboItemCount?: number;
};


type Ctx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: number;
  total: number;
  ready: boolean;
};

const CartCtx = createContext<Ctx | null>(null);
const KEY = "upcurv-enquiry-cart";

export function EnquiryCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, ready]);

  const value = useMemo<Ctx>(() => {
    return {
      items,
      ready,
      add: (item, qty = 1) =>
        setItems((prev) => {
          const found = prev.find((p) => p.productId === item.productId);
          if (found)
            return prev.map((p) =>
              p.productId === item.productId ? { ...p, qty: p.qty + qty } : p,
            );
          return [...prev, { ...item, qty }];
        }),
      setQty: (productId, qty) =>
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => p.productId !== productId)
            : prev.map((p) => (p.productId === productId ? { ...p, qty } : p)),
        ),
      remove: (productId) => setItems((prev) => prev.filter((p) => p.productId !== productId)),
      clear: () => setItems([]),
      count: items.reduce((s, i) => s + i.qty, 0),
      total: items.reduce((s, i) => s + i.qty * i.price, 0),
    };
  }, [items, ready]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart() {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart must be used inside EnquiryCartProvider");
  return ctx;
}

export function useSource() {
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("source");
    if (param) localStorage.setItem("upcurv-source", param.toLowerCase());
  }, []);
}

export function readSource() {
  if (typeof window === "undefined") return "direct";
  return localStorage.getItem("upcurv-source") || "direct";
}
