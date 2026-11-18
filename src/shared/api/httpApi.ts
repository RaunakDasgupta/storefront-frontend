// The same interfaces as ./mock.ts, talking to your server. The request and response shapes are documented in the README
// ("Connecting a real API"). Everything that comes back is checked before the app uses it.
import { isProduct } from "../lib/catalog.ts";
import { isSkuRow } from "../lib/csv.ts";
import { isOrder, withChannel, type Order } from "../lib/orderlogic.ts";
import { ApiError, type Http } from "./http.ts";
import type { AdminAuthApi, CustomerAuthApi, ImportApi, OrdersApi, PaymentsApi, ProductsApi, Session } from "./types.ts";

const unexpected = (what: string) => new ApiError(`The server sent ${what} in a format this app does not understand.`);
const at = (base: string, ...parts: string[]) => [base, ...parts.map(encodeURIComponent)].join("/");

const asProduct = (data: unknown) => { if (!isProduct(data)) throw unexpected("a product"); return data; };
const asOrder = (data: unknown): Order => { if (!isOrder(data)) throw unexpected("an order"); return withChannel(data); };
const asOrders = (data: unknown): Order[] => { if (!Array.isArray(data) || !data.every(isOrder)) throw unexpected("orders"); return data.map(withChannel); };

function asSession(data: unknown): Session {
  const d = data as { user?: { name?: unknown; email?: unknown }; token?: unknown } | null;
  if (typeof d?.user?.name !== "string" || typeof d.user.email !== "string" || typeof d.token !== "string") throw unexpected("a sign-in");
  return { user: { name: d.user.name, email: d.user.email }, token: d.token };
}

export const httpProducts = (http: Http, url: string): ProductsApi => ({
  async list() {
    const data = await http(url);
    if (!Array.isArray(data) || !data.every(isProduct)) throw unexpected("products");
    return data;
  },
  async update(id, edit) { return asProduct(await http(at(url, id), { method: "PATCH", body: edit })); },
  async remove(id) { await http(at(url, id), { method: "DELETE" }); },
  async restore(product) { return asProduct(await http(at(url, product.id, "restore"), { method: "POST" })); },
  async importRows(rows) {
    const d = (await http(at(url, "import"), { method: "POST", body: { rows } })) as { added?: unknown; updated?: unknown } | null;
    if (!Number.isFinite(d?.added) || !Number.isFinite(d?.updated)) throw unexpected("an import result");
    return { added: d!.added as number, updated: d!.updated as number };
  },
});

export const httpOrders = (http: Http, url: string): OrdersApi => ({
  async list() { return asOrders(await http(url)); },
  async create(input) { return asOrders(await http(url, { method: "POST", body: input })); },
  async setStep(id, step) { return asOrder(await http(at(url, id), { method: "PATCH", body: { step } })); },
  async remove(id) { await http(at(url, id), { method: "DELETE" }); },
  async restore(order) { return asOrder(await http(at(url, order.id, "restore"), { method: "POST" })); },
});

export const httpCustomerAuth = (http: Http, url: string): CustomerAuthApi => ({
  async signIn(input) { return asSession(await http(at(url, "login"), { method: "POST", body: input })); },
  async signUp(input) { return asSession(await http(at(url, "register"), { method: "POST", body: input })); },
});

export const httpAdminAuth = (http: Http, url: string): AdminAuthApi => ({
  async signIn(input) { return asSession(await http(at(url, "login"), { method: "POST", body: input })); },
});

// shortcut: card details go to your own payments endpoint. Before taking real payments, tokenize the card in the browser with
// your gateway's hosted fields (Stripe Elements, Razorpay Checkout...) and send the token here instead.
export const httpPayments = (http: Http, url: string): PaymentsApi => ({
  async charge({ amount, card }) {
    try {
      const d = (await http(url, { method: "POST", body: { amount, currency: "INR", card } })) as { ref?: unknown } | null;
      if (typeof d?.ref !== "string") throw unexpected("a payment");
      return { ok: true, ref: d.ref };
    } catch (e) {
      // 402 is the conventional "payment declined": show the reason instead of failing the whole checkout
      if (e instanceof ApiError && (e.status === 402 || e.status === 422)) return { ok: false, message: e.message };
      throw e;
    }
  },
});

export const httpImporter = (http: Http, url: string): ImportApi => ({
  async connect(input) {
    const d = (await http(at(url, "connect"), { method: "POST", body: input })) as { rows?: unknown } | null;
    if (!Array.isArray(d?.rows) || !d.rows.every(isSkuRow)) throw unexpected("products to import");
    return d.rows;
  },
});
