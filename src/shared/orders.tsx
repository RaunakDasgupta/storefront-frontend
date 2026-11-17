// One orders store for both apps: customers place orders in the storefront, staff see them in the portal.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { SAMPLE_ORDERS, isOrder, makeOrder, withStep, type Order, type OrderItem } from "./orderlogic";

// shortcut: orders live in this browser's localStorage; replace with your orders API.
const KEY = "everyday.orders";

type Orders = {
  orders: Order[];
  /** Adds a new order (at "Confirmed", newest first) for this customer and returns it. */
  place: (customer: Order["customer"], items: OrderItem[]) => Order;
  /** Staff moves an order to a new fulfilment step; customers see it on their next view (or live in another tab). */
  setStep: (id: string, step: number) => void;
};
const Ctx = createContext<Orders | null>(null);

function load(): Order[] {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (Array.isArray(saved) && saved.every(isOrder)) return saved;
  } catch { /* fall through to the sample orders */ }
  return SAMPLE_ORDERS;
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>(load);

  // another tab (for example the customer storefront) placed an order: pick it up straight away
  useEffect(() => {
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setOrders(load()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const place: Orders["place"] = (customer, items) => {
    const order = makeOrder(orders, customer, items);
    const next = [order, ...orders];
    setOrders(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: lasts this session */ }
    return order;
  };

  const setStep: Orders["setStep"] = (id, step) => {
    const next = withStep(orders, id, step);
    setOrders(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: lasts this session */ }
  };

  return <Ctx.Provider value={{ orders, place, setStep }}>{children}</Ctx.Provider>;
}

export function useOrders() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrders must be used inside <OrdersProvider>");
  return ctx;
}
