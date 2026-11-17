// Order types and pure helpers. No React here so the tests can run under `node --test`.
import { seedProducts } from "./data.ts";

export const STEPS = ["Confirmed", "Preparing", "Packed", "Ready for dispatch"] as const;
export const STEP_MESSAGE = [
  "We have received your order.",
  "We are preparing your order for packing.",
  "Your order is packed.",
  "Your order is ready for dispatch.",
] as const;

export type Step = 0 | 1 | 2 | 3;
export type OrderItem = { id: string; name: string; size?: string; qty: number; price: number };
export type Order = { id: string; date: string; customer: { name: string; email: string }; items: OrderItem[]; total: number; step: Step };

/** Returns the list with one order moved to a new fulfilment step. Unknown ids and invalid steps leave it unchanged. */
export const withStep = (list: Order[], id: string, step: number): Order[] =>
  ([0, 1, 2, 3] as const).includes(step as Step) ? list.map((o) => (o.id === id ? { ...o, step: step as Step } : o)) : list;

export const itemCount = (o: Order) => o.items.reduce((n, i) => n + i.qty, 0);
export const orderTotal = (items: OrderItem[]) => items.reduce((s, i) => s + i.qty * i.price, 0);
export const revenueOf = (list: Order[]) => list.reduce((s, o) => s + o.total, 0);

const num = (o: Order) => Number(o.id.replace(/\D/g, "")) || 0;
export const nextOrderId = (list: Order[]) => `ORD_${String(Math.max(1000, ...list.map(num)) + 1).padStart(4, "0")}`;

export function makeOrder(list: Order[], customer: Order["customer"], items: OrderItem[], date = new Date().toISOString().slice(0, 10)): Order {
  return { id: nextOrderId(list), date, customer, items, total: orderTotal(items), step: 0 };
}

/** Guards what comes back from localStorage. */
export function isOrder(o: unknown): o is Order {
  const x = o as Order;
  return !!x && typeof x.id === "string" && typeof x.date === "string" && typeof x.customer?.email === "string" && typeof x.customer?.name === "string" &&
    Array.isArray(x.items) && Number.isFinite(x.total) && [0, 1, 2, 3].includes(x.step);
}

// shortcut: sample orders for the demo. The first one belongs to the demo customer login.
const line = (id: string, qty: number): OrderItem => {
  const p = seedProducts.find((s) => s.id === id)!;
  return { id, name: p.name, size: p.size, qty, price: p.price };
};
const sample = (n: number, name: string, email: string, date: string, step: Step, lines: [string, number][]): Order => {
  const items = lines.map(([id, q]) => line(id, q));
  return { id: `ORD_${String(n).padStart(4, "0")}`, date, customer: { name, email }, items, total: orderTotal(items), step };
};

export const SAMPLE_ORDERS: Order[] = [
  sample(1001, "Alex Morgan", "customer@storefront.test", "2026-11-16", 1, [["detergent", 3], ["shampoo", 2]]),
  sample(1000, "Liam Chen", "liam.chen@example.com", "2026-11-16", 0, [["tissue-box", 4], ["hand-wash", 2]]),
  sample(999, "Sofia Rossi", "sofia.rossi@example.com", "2026-11-15", 3, [["detergent-carton", 1], ["tissue-carton", 1]]),
  sample(998, "Noah Williams", "noah.williams@example.com", "2026-11-15", 2, [["surface-cleaner", 2], ["glass-cleaner", 2]]),
  sample(997, "Mia Johnson", "mia.johnson@example.com", "2026-11-14", 3, [["toilet-paper", 3]]),
  sample(996, "Ethan Brown", "ethan.brown@example.com", "2026-11-14", 3, [["kitchen-towel", 6], ["tissue-box", 2]]),
  sample(995, "Isha Rao", "isha.rao@example.com", "2026-11-13", 3, [["shampoo-carton", 1]]),
  sample(994, "Arjun Mehta", "arjun.mehta@example.com", "2026-11-13", 2, [["detergent", 5], ["surface-cleaner", 3]]),
  sample(993, "Kavya Nair", "kavya.nair@example.com", "2026-11-12", 3, [["toilet-paper-carton", 1]]),
  sample(992, "Rohan Das", "rohan.das@example.com", "2026-11-12", 3, [["hand-wash", 4], ["shampoo", 4]]),
  sample(991, "Neha Gupta", "neha.gupta@example.com", "2026-11-11", 3, [["glass-cleaner", 6]]),
  sample(990, "Vikram Singh", "vikram.singh@example.com", "2026-11-11", 3, [["tissue-box", 10]]),
];
