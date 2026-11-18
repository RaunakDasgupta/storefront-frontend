// The HTTP side of the data layer, against a fake fetch, and the choice between mock and real per resource.
import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveEndpoints } from "./config.ts";
import { ApiError, createHttp } from "./http.ts";
import { createApi } from "./index.ts";
import { memoryKV } from "./kv.ts";
import { seedProducts } from "../lib/data.ts";
import { SAMPLE_ORDERS } from "../lib/orderlogic.ts";
import { isSafeImage } from "../lib/productform.ts";

type Call = { url: string; method?: string; headers: Record<string, string>; body?: string };
/** A fetch that records what was asked and answers from a queue. */
function fakeFetch(...answers: { status?: number; body?: unknown; throws?: boolean }[]) {
  const calls: Call[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, method: init.method, headers: init.headers as Record<string, string>, body: init.body as string | undefined });
    const a = answers.shift() ?? { status: 200, body: null };
    if (a.throws) throw new TypeError("network down");
    return new Response(a.body === undefined ? null : JSON.stringify(a.body), { status: a.status ?? 200 });
  }) as typeof fetch;
  return { calls, fetchImpl };
}

test("a base URL gives every resource a default path, and a specific URL wins", () => {
  assert.deepEqual(resolveEndpoints({}), {});
  const urls = resolveEndpoints({ VITE_API_URL: " https://api.example.com/v1/ ", VITE_PRODUCTS_URL: "https://catalog.example.com/items/" });
  assert.equal(urls.products, "https://catalog.example.com/items");
  assert.equal(urls.orders, "https://api.example.com/v1/orders");
  assert.equal(urls.customerAuth, "https://api.example.com/v1/auth");
  assert.equal(urls.adminAuth, "https://api.example.com/v1/admin/auth");
  assert.equal(urls.importer, "https://api.example.com/v1/import");
  assert.deepEqual(Object.keys(resolveEndpoints({ VITE_ORDERS_URL: "https://o.example.com" })), ["orders"]);
});

test("the client sends JSON and the token, and returns the parsed body", async () => {
  const { calls, fetchImpl } = fakeFetch({ body: { ok: true } });
  const http = createHttp({ fetchImpl, getToken: () => "abc" });
  assert.deepEqual(await http("https://x.test/a", { method: "POST", body: { n: 1 } }), { ok: true });
  assert.equal(calls[0].method, "POST");
  assert.equal(calls[0].headers.Authorization, "Bearer abc");
  assert.equal(calls[0].headers["Content-Type"], "application/json");
  assert.equal(calls[0].body, '{"n":1}');
});

test("errors carry the server's message, a 401 calls onUnauthorized, and a dead network is explained", async () => {
  let signedOut = 0;
  const { fetchImpl } = fakeFetch({ status: 401, body: { message: "Session expired." } }, { status: 500, body: "<html>" }, { throws: true });
  const http = createHttp({ fetchImpl, onUnauthorized: () => { signedOut++; } });
  await assert.rejects(http("https://x.test/a"), (e: ApiError) => e.message === "Session expired." && e.status === 401);
  assert.equal(signedOut, 1);
  await assert.rejects(http("https://x.test/a"), /error \(500\)/);
  await assert.rejects(http("https://x.test/a"), /Can't reach the server/);
});

test("a resource with a URL talks to the server, the rest stay on the mock", async () => {
  const { calls, fetchImpl } = fakeFetch({ body: seedProducts.slice(0, 2) });
  const api = createApi({ env: { VITE_PRODUCTS_URL: "https://api.example.com/products" }, fetchImpl, mockStorage: memoryKV() });
  assert.equal(api.sources.products, "api");
  assert.equal(api.sources.orders, "mock");
  assert.equal((await api.products.list()).length, 2);
  assert.equal(calls[0].url, "https://api.example.com/products");
  assert.equal((await api.orders.list()).length, SAMPLE_ORDERS.length, "orders never touched the network");
  assert.equal(calls.length, 1);
});

test("the HTTP resources use the documented paths and check what comes back", async () => {
  const order = SAMPLE_ORDERS[0];
  const { calls, fetchImpl } = fakeFetch(
    { body: { ...seedProducts[0], name: "Edited" } },
    { status: 204 },
    { body: seedProducts[0] },
    { body: { added: 2, updated: 1 } },
    { body: { ...order, step: 2 } },
    { body: [order] },
    { body: [{ nonsense: true }] },
    { body: { user: { name: "Pat", email: "pat@example.com" }, token: "t0k" } },
    { body: { user: { name: "Pat" } } },
    { status: 402, body: { message: "Card declined." } },
    { body: { ref: "pay_1" } },
    { body: { rows: [{ sku: "A", name: "A", category: "c", price: 1, stock: 1, blurb: "", channel: "retail" }] } },
  );
  const api = createApi({ env: { VITE_API_URL: "https://api.example.com" }, fetchImpl, mockStorage: memoryKV() });
  assert.equal((await api.products.update("det", { ...seedProducts[0], name: "Edited" })).name, "Edited");
  await api.products.remove("det");
  await api.products.restore(seedProducts[0], 0);
  assert.deepEqual(await api.products.importRows([]), { added: 2, updated: 1 });
  assert.equal((await api.orders.setStep(order.id, 2)).step, 2);
  assert.equal((await api.orders.create({ customer: order.customer, shipping: { fullName: "", phone: "", line1: "", line2: "", city: "", state: "", pin: "" }, paymentRef: "p", groups: [] })).length, 1);
  await assert.rejects(api.orders.list(), /format this app does not understand/);
  assert.equal((await api.customerAuth.signIn({ email: "pat@example.com", password: "x" })).token, "t0k");
  await assert.rejects(api.adminAuth.signIn({ identity: "a", password: "b" }), /sign-in/);
  const declined = await api.payments.charge({ amount: 10, card: { number: "4000", name: "P", expiry: "12/39", cvc: "1" } });
  assert.deepEqual(declined, { ok: false, message: "Card declined." });
  assert.deepEqual(await api.payments.charge({ amount: 10, card: { number: "4242", name: "P", expiry: "12/39", cvc: "1" } }), { ok: true, ref: "pay_1" });
  assert.equal((await api.importer.connect({ connector: "postgres", service: "postgres", settings: {} })).length, 1);
  assert.deepEqual(calls.map((c) => `${c.method ?? "GET"} ${c.url.replace("https://api.example.com", "")}`), [
    "PATCH /products/det", "DELETE /products/det", "POST /products/detergent/restore", "POST /products/import",
    `PATCH /orders/${order.id}`, "POST /orders", "GET /orders", "POST /auth/login", "POST /admin/auth/login", "POST /payments", "POST /payments", "POST /import/connect",
  ]);
});

test("the mock API serves the whole interface from storage and never needs the network", async () => {
  const api = createApi({ env: {}, mockStorage: memoryKV(), mock: { paymentDelayMs: 0, connectDelayMs: 0 } });
  assert.ok(Object.values(api.sources).every((s) => s === "mock"));
  assert.equal((await api.customerAuth.signIn({ email: "customer@storefront.test", password: "customer123" })).user.name, "Alex Morgan");
  assert.equal((await api.adminAuth.signIn({ identity: "EMP-1001", password: "admin1234" })).user.name, "Sam Rivera");
  await assert.rejects(api.adminAuth.signIn({ identity: "EMP-1001", password: "nope" }), /incorrect/);
  const rows = await api.importer.connect({ connector: "sqlite", service: "sqlite", settings: {} });
  assert.equal(rows.length, 5);
  // the new SKUs come with a logo that points at a bundled photo, so the preview and the shop show pictures
  assert.ok(rows.slice(0, 4).every((r) => r.image && isSafeImage(r.image)));
});

test("adding a product posts it to the products URL and returns what the server saved", async () => {
  const input = { sku: "NEW-001", name: "Fresh thing", category: "Snacks", channel: "retail" as const, price: 49, stock: 12, blurb: "" };
  const { calls, fetchImpl } = fakeFetch({ body: { id: "new-001", ...input } });
  const api = createApi({ env: { VITE_API_URL: "https://api.example.com" }, fetchImpl, mockStorage: memoryKV() });
  assert.equal((await api.products.create(input)).id, "new-001");
  assert.equal(`${calls[0].method} ${calls[0].url}`, "POST https://api.example.com/products");
  assert.deepEqual(JSON.parse(calls[0].body!), input);
});
