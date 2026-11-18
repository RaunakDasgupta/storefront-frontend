// Slice, selector and thunk tests, run against the mock API. Run with `npm test` (node --test, no extra dependencies).
import assert from "node:assert/strict";
import { test } from "node:test";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import type { Api } from "../api/types.ts";
import { testApi } from "../api/testing.ts";
import { seedProducts } from "../lib/data.ts";
import type { SkuRow } from "../lib/csv.ts";
import { SAMPLE_ORDERS, countByStep, revenueByDay } from "../lib/orderlogic.ts";
import { addProduct, importSkus, loadCatalog, removeProduct, resetCatalog, restoreProduct, saveProduct, selectCatalogStatus, selectCategories, selectProducts } from "./catalogSlice.ts";
import { loadOrders, placeOrders, removeOrder, restoreOrder, selectOrders, selectOrdersStatus, setOrderStep } from "./ordersSlice.ts";
import { sharedReducers } from "./shared.ts";

const makeStore = (api: Api = testApi()) => configureStore({
  reducer: combineReducers(sharedReducers),
  preloadedState: { meta: { sources: api.sources } },
  middleware: (getDefault) => getDefault({ thunk: { extraArgument: { api } } }),
});
/** A store whose catalog and orders have already been loaded, like the apps after their first screen. */
async function loadedStore(api?: Api) {
  const store = makeStore(api);
  await store.dispatch(loadCatalog());
  await store.dispatch(loadOrders());
  return store;
}
const customer = { name: "Pat", email: "pat@example.com" };
const shipping = { fullName: "Pat", phone: "9876543210", line1: "1 Road", line2: "", city: "Pune", state: "MH", pin: "411001" };
const place = (groups: Parameters<typeof placeOrders>[0]["groups"]) => placeOrders({ customer, shipping, paymentRef: "PAY_TEST", groups });
const row = (o: Partial<SkuRow> & { sku: string }): SkuRow => ({ name: "New thing", category: "Snacks", channel: "retail", price: 10, stock: 5, blurb: "", ...o }) as SkuRow;

test("the catalog is empty and idle until it is loaded, then holds the API's products", async () => {
  const store = makeStore();
  assert.equal(selectCatalogStatus(store.getState()), "idle");
  assert.equal(selectProducts(store.getState()).length, 0);
  const pending = store.dispatch(loadCatalog());
  assert.equal(selectCatalogStatus(store.getState()), "loading");
  await pending;
  assert.equal(selectCatalogStatus(store.getState()), "ready");
  assert.deepEqual(selectProducts(store.getState()), seedProducts);
});

test("a failed load shows the API's message, and a retry can recover", async () => {
  let fail = true;
  const api = testApi();
  const list = api.products.list;
  api.products.list = async () => { if (fail) throw new Error("Server is down."); return list(); };
  const store = makeStore(api);
  await store.dispatch(loadCatalog());
  assert.equal(store.getState().catalog.status, "failed");
  assert.equal(store.getState().catalog.error, "Server is down.");
  fail = false;
  await store.dispatch(loadCatalog());
  assert.equal(store.getState().catalog.status, "ready");
  // a failed refresh keeps what is already shown
  fail = true;
  await store.dispatch(loadCatalog());
  assert.equal(store.getState().catalog.status, "ready");
  assert.equal(selectProducts(store.getState()).length, seedProducts.length);
});

test("editing a product saves it through the API and changes only that product", async () => {
  const api = testApi();
  const store = await loadedStore(api);
  const first = seedProducts[0];
  await store.dispatch(saveProduct(first.id, { name: "Renamed", price: 99, stock: 1, category: first.category, blurb: first.blurb, channel: first.channel, size: first.size, was: undefined, image: first.image }));
  const products = selectProducts(store.getState());
  assert.equal(products[0].name, "Renamed");
  assert.equal(products[0].sku, first.sku);
  assert.equal(products[1].name, seedProducts[1].name);
  assert.equal((await api.products.list())[0].name, "Renamed", "the API has it too");
  await assert.rejects(store.dispatch(saveProduct("nope", { ...first })), /not found/);
});

test("a change the API refuses leaves the store untouched and throws its message", async () => {
  const api = testApi();
  api.products.remove = async () => { throw new Error("You can't delete this."); };
  const store = await loadedStore(api);
  await assert.rejects(store.dispatch(removeProduct(seedProducts[0].id)), /can't delete/);
  assert.equal(selectProducts(store.getState()).length, seedProducts.length);
});

test("removing a product can be undone at the same position", async () => {
  const store = await loadedStore();
  const gone = await store.dispatch(removeProduct(seedProducts[2].id));
  assert.equal(gone?.index, 2);
  assert.equal(selectProducts(store.getState()).some((p) => p.id === gone?.product.id), false);
  await store.dispatch(restoreProduct(gone!.product, gone!.index));
  assert.equal(selectProducts(store.getState())[2].id, seedProducts[2].id);
  assert.equal(await store.dispatch(removeProduct("nope")), undefined);
});

test("importing SKUs adds new ones and updates existing ones by SKU", async () => {
  const store = await loadedStore();
  const result = await store.dispatch(importSkus([row({ sku: seedProducts[0].sku, name: "Updated", price: 1 }), row({ sku: "BRAND-NEW" })]));
  assert.deepEqual(result, { added: 1, updated: 1 });
  const products = selectProducts(store.getState());
  assert.equal(products.length, seedProducts.length + 1);
  assert.equal(products[0].name, "Updated");
  assert.equal(products.at(-1)?.id, "brand-new");
});

test("resetting the catalog goes back to the sample products, and only the mock can", async () => {
  const store = await loadedStore();
  await store.dispatch(removeProduct(seedProducts[0].id));
  await store.dispatch(resetCatalog());
  assert.deepEqual(selectProducts(store.getState()), seedProducts);
  const live = testApi();
  delete live.products.reset;
  await assert.rejects((await loadedStore(live)).dispatch(resetCatalog()), /only available/);
});

test("categories are listed once each, in catalog order", async () => {
  const cats = selectCategories((await loadedStore()).getState());
  assert.equal(new Set(cats).size, cats.length);
  assert.equal(cats[0], seedProducts[0].category);
});

test("the orders load from the API", async () => {
  const store = makeStore();
  assert.equal(selectOrdersStatus(store.getState()), "idle");
  await store.dispatch(loadOrders());
  assert.equal(selectOrdersStatus(store.getState()), "ready");
  assert.deepEqual(selectOrders(store.getState()), SAMPLE_ORDERS);
});

test("placing orders adds one order per channel, newest first, and returns them", async () => {
  const store = await loadedStore();
  const before = selectOrders(store.getState()).length;
  const made = await store.dispatch(place([
    { channel: "retail", items: [{ id: "a", name: "A", qty: 2, price: 10 }] },
    { channel: "bulk", items: [] },
    { channel: "bulk", items: [{ id: "b", name: "B", qty: 1, price: 50 }] },
  ]));
  assert.equal(made.length, 2);
  assert.deepEqual(made.map((o) => o.shipping), [shipping, shipping]);
  const orders = selectOrders(store.getState());
  assert.equal(orders.length, before + 2);
  assert.deepEqual(orders.slice(0, 2).map((o) => o.id), [made[1].id, made[0].id]);
  assert.equal(orders[1].total, 20);
});

test("admin can change a status, delete an order and undo the delete", async () => {
  const store = await loadedStore();
  const [order] = await store.dispatch(place([{ channel: "retail", items: [{ id: "a", name: "A", qty: 1, price: 5 }] }]));
  await store.dispatch(setOrderStep(order.id, 2));
  assert.equal(selectOrders(store.getState())[0].step, 2);
  await assert.rejects(store.dispatch(setOrderStep(order.id, 9)), /not a valid/);
  assert.equal(selectOrders(store.getState())[0].step, 2);

  const removed = await store.dispatch(removeOrder(order.id));
  assert.equal(selectOrders(store.getState()).some((o) => o.id === order.id), false);
  await store.dispatch(restoreOrder(removed!.order, removed!.index));
  assert.equal(selectOrders(store.getState())[0].id, order.id);
  assert.equal(await store.dispatch(removeOrder("ORD_0")), undefined);
});

test("dashboard helpers count orders per step and total revenue per day", () => {
  const list = [
    { ...SAMPLE_ORDERS[0], date: "2026-11-16", step: 0 as const, total: 100 },
    { ...SAMPLE_ORDERS[1], date: "2026-11-16", step: 3 as const, total: 50 },
    { ...SAMPLE_ORDERS[2], date: "2026-11-14", step: 3 as const, total: 25 },
  ];
  assert.deepEqual(countByStep(list), [1, 0, 0, 2]);
  const days = revenueByDay(list, 4);
  assert.deepEqual(days.map((d) => d.date), ["2026-11-13", "2026-11-14", "2026-11-15", "2026-11-16"]);
  assert.deepEqual(days.map((d) => d.revenue), [0, 25, 0, 150]);
  assert.deepEqual(revenueByDay([]), []);
});

test("adding a product puts it at the end with an id made from its SKU, and refuses a SKU that is taken", async () => {
  const store = await loadedStore();
  const input = { sku: "NEW-001", name: "Fresh thing", category: "Snacks", channel: "retail" as const, price: 49, stock: 12, blurb: "" };
  const created = await store.dispatch(addProduct(input));
  assert.equal(created.id, "new-001");
  assert.equal(selectProducts(store.getState()).at(-1)?.sku, "NEW-001");
  await assert.rejects(store.dispatch(addProduct({ ...input, sku: "new-001" })), /already exists/);
  assert.equal(selectProducts(store.getState()).length, seedProducts.length + 1);
});
