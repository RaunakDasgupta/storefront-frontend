// The built-in sample data, behind the same interfaces as the real API. It keeps the catalog, orders and sign-ups in
// this browser's localStorage, so the app works with no server. Each resource switches to your API on its own (see ./index.ts).
// shortcut: no real payments, no real database connections, and no per-customer order filtering (the store does that).
import { isProduct, mergeRows, uniqueId } from "../lib/catalog.ts";
import type { SkuRow } from "../lib/csv.ts";
import { seedProducts, type Product } from "../lib/data.ts";
import { SAMPLE_ORDERS, isOrder, makeOrders, withChannel, withOrderAt, withStep, withoutOrder, type Order } from "../lib/orderlogic.ts";
import { ApiError } from "./http.ts";
import { browserStorage, readJson, writeJson, type KV } from "./kv.ts";
import { registerCustomer, signInAdmin, signInCustomer } from "./mockAccounts.ts";
import type { Api, Card, ImportApi, OrdersApi, PaymentsApi, ProductsApi } from "./types.ts";

const CATALOG_KEY = "everyday.catalog";
export const ORDERS_KEY = "everyday.orders";

/** Test cards for the demo payment: the first is approved, the second is declined on purpose. */
export const TEST_CARD = "4242 4242 4242 4242";
export const DECLINED_CARD = "4000 0000 0000 0002";
const DECLINES: Record<string, string> = {
  "4000000000000002": "Your card was declined. Try a different card.",
  "4000000000009995": "Your card has insufficient funds. Try a different card.",
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const notFound = (what: string) => new ApiError(`${what} not found.`, 404);

function mockProducts(kv: KV): ProductsApi {
  const read = (): Product[] => { const saved = readJson(kv, CATALOG_KEY); return Array.isArray(saved) && saved.every(isProduct) ? saved : [...seedProducts]; };
  const write = (list: Product[]) => writeJson(kv, CATALOG_KEY, list);
  return {
    async list() { return read(); },
    async create(input) {
      const list = read();
      if (list.some((p) => p.sku.toLowerCase() === input.sku.toLowerCase())) throw new ApiError(`A product with the SKU ${input.sku} already exists.`, 409);
      const product: Product = { id: uniqueId(list, input.sku), ...input };
      write([...list, product]);
      return product;
    },
    async update(id, edit) {
      const list = read();
      const found = list.find((p) => p.id === id);
      if (!found) throw notFound("Product");
      const next = { ...found, ...edit };
      write(list.map((p) => (p.id === id ? next : p)));
      return next;
    },
    async remove(id) { write(read().filter((p) => p.id !== id)); },
    async restore(product, index) {
      const list = read();
      if (!list.some((p) => p.id === product.id)) { list.splice(Math.min(index, list.length), 0, product); write(list); }
      return product;
    },
    async importRows(rows) {
      const { products, added, updated } = mergeRows(read(), rows);
      write(products);
      return { added, updated };
    },
    async reset() { writeJson(kv, CATALOG_KEY, null); },
  };
}

function mockOrders(kv: KV): OrdersApi {
  const read = (): Order[] => { const saved = readJson(kv, ORDERS_KEY); return Array.isArray(saved) && saved.every(isOrder) ? (saved as Order[]).map(withChannel) : SAMPLE_ORDERS; };
  const write = (list: Order[]) => writeJson(kv, ORDERS_KEY, list);
  return {
    async list() { return read(); },
    async create({ customer, shipping, groups }) {
      const list = read();
      const made = makeOrders(list, customer, groups, undefined, shipping);
      write([...[...made].reverse(), ...list]);
      return made;
    },
    async setStep(id, step) {
      const list = read();
      const next = withStep(list, id, step);
      const found = next.find((o) => o.id === id);
      if (!found) throw notFound("Order");
      if (found.step !== step) throw new ApiError("That is not a valid order status.", 400);
      write(next);
      return found;
    },
    async remove(id) { write(withoutOrder(read(), id)); },
    async restore(order, index) { write(withOrderAt(read(), order, index)); return order; },
  };
}

function mockPayments(delayMs: number): PaymentsApi {
  return {
    async charge({ card }: { amount: number; card: Card }) {
      await wait(delayMs);
      const declined = DECLINES[card.number.replace(/\D/g, "")];
      return declined ? { ok: false, message: declined } : { ok: true, ref: `PAY_${crypto.randomUUID().slice(0, 8).toUpperCase()}` };
    },
  };
}

const SOURCE_NAMES: Record<string, string> = { postgres: "PostgreSQL", sqlite: "SQLite", aws: "Amazon Web Services", gcp: "Google Cloud" };

/** Sample products standing in for what a real source would return: four new SKUs (with logos from the bundled photos) and one change to an existing product. */
function mockImporter(delayMs: number): ImportApi {
  return {
    async connect({ connector }) {
      await wait(delayMs);
      const blurb = `Imported from ${SOURCE_NAMES[connector] ?? connector}.`;
      const existing = seedProducts[0];
      const rows: SkuRow[] = [
        { sku: "DB-101", name: "Dishwash liquid", size: "500 ml", price: 129, category: "Home care", blurb, stock: 80, channel: "retail", image: "/products/sponge-scrubbers.jpg" },
        { sku: "DB-102", name: "Body lotion", size: "250 ml", price: 219, category: "Personal care", blurb, stock: 36, channel: "retail", image: "/products/shampoo.jpg" },
        { sku: "DB-103", name: "Paper napkins", size: "Pack of 100", price: 79, category: "Paper essentials", blurb, stock: 120, channel: "retail", image: "/products/tissue-box.jpg" },
        { sku: "DB-201", name: "Dishwash liquid", size: "Carton of 12", price: 1399, category: "Home care", blurb, stock: 20, channel: "bulk", image: "/products/detergent.jpg" },
        { sku: existing.sku, name: existing.name, size: existing.size, price: existing.price - 10, category: existing.category, blurb: existing.blurb, stock: existing.stock, channel: existing.channel },
      ];
      return rows;
    },
  };
}

export type MockOptions = { paymentDelayMs?: number; connectDelayMs?: number };

/** The whole API, served from `kv` (localStorage in the app, memory in tests). */
export function createMockApi(kv: KV = browserStorage("local"), { paymentDelayMs = 1500, connectDelayMs = 1200 }: MockOptions = {}): Omit<Api, "sources"> {
  return {
    products: mockProducts(kv),
    orders: mockOrders(kv),
    customerAuth: {
      async signIn({ email, password }) { return { user: signInCustomer(kv, email, password) }; },
      async signUp({ name, email, password }) { return { user: registerCustomer(kv, name, email, password) }; },
    },
    adminAuth: { async signIn({ identity, password }) { return { user: signInAdmin(identity, password) }; } },
    payments: mockPayments(paymentDelayMs),
    importer: mockImporter(connectDelayMs),
  };
}
