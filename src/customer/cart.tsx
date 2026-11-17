import { createContext, useContext, useState, type ReactNode } from "react";
import { useCatalog } from "../shared/catalog";

type Cart = {
  lines: { id: string; qty: number }[];
  count: number;
  total: number;
  add: (id: string) => void;
  setQty: (id: string, qty: number) => void; // qty <= 0 removes the line
  clear: () => void;
};

const Ctx = createContext<Cart | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { byId } = useCatalog();
  const [lines, setLines] = useState<Cart["lines"]>([]);

  const add: Cart["add"] = (id) =>
    setLines((ls) => (ls.some((l) => l.id === id) ? ls.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)) : [...ls, { id, qty: 1 }]));
  const setQty: Cart["setQty"] = (id, qty) =>
    setLines((ls) => (qty <= 0 ? ls.filter((l) => l.id !== id) : ls.map((l) => (l.id === id ? { ...l, qty } : l))));

  const clear = () => setLines([]);

  const count = lines.reduce((n, l) => n + l.qty, 0);
  const total = lines.reduce((n, l) => n + l.qty * (byId(l.id)?.price ?? 0), 0);

  return <Ctx.Provider value={{ lines, count, total, add, setQty, clear }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
