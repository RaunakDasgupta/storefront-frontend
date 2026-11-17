// The customer's own orders and their progress. Separate from the staff order sample data.
import { createContext, useContext, useState, type ReactNode } from "react";

export const STEPS = ["Confirmed", "Preparing", "Packed", "Ready for dispatch"] as const;
export const STEP_MESSAGE = [
  "We have received your order.",
  "We are preparing your order for packing.",
  "Your order is packed.",
  "Your order is ready for dispatch.",
] as const;

export type OrderItem = { id: string; name: string; size?: string; qty: number; price: number };
export type CustomerOrder = { id: string; date: string; items: OrderItem[]; total: number; step: 0 | 1 | 2 | 3 };

// shortcut: demo orders live in this browser's localStorage and never move past "Confirmed" on their own;
// replace with your orders API (fulfilment updates would come from the warehouse system).
const KEY = "everyday.customer.orders";
const SAMPLE: CustomerOrder = {
  id: "ORD_1001",
  date: "2026-11-16",
  items: [
    { id: "detergent", name: "Detergent", size: "1 kg", qty: 3, price: 249 },
    { id: "shampoo", name: "Shampoo", size: "500 ml", qty: 2, price: 199 },
  ],
  total: 1145,
  step: 1,
};

type Orders = { orders: CustomerOrder[]; place: (items: OrderItem[]) => CustomerOrder };
const Ctx = createContext<Orders | null>(null);

export const itemCount = (o: CustomerOrder) => o.items.reduce((n, i) => n + i.qty, 0);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<CustomerOrder[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (Array.isArray(saved) && saved.every((o) => typeof o?.id === "string" && Array.isArray(o.items))) return saved;
    } catch { /* fall through to the sample order */ }
    return [SAMPLE];
  });

  const place: Orders["place"] = (items) => {
    const order: CustomerOrder = {
      id: `ORD_${1001 + orders.length}`,
      date: new Date().toISOString().slice(0, 10),
      items,
      total: items.reduce((s, i) => s + i.qty * i.price, 0),
      step: 0,
    };
    const next = [order, ...orders];
    setOrders(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: lasts this session */ }
    return order;
  };

  return <Ctx.Provider value={{ orders, place }}>{children}</Ctx.Provider>;
}

export function useOrders() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>");
  return ctx;
}
