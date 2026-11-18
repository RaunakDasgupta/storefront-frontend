// Slice, selector and thunk tests. Run with `npm test` (node --test, no extra dependencies).
import assert from "node:assert/strict";
import { test } from "node:test";
import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { seedProducts } from "../lib/data.ts";
import type { SkuRow } from "../lib/csv.ts";
import { catalogReset, importSkus, productRestored, productUpdated, removeProduct, selectCategories, selectCustomized, selectProducts } from "./catalogSlice.ts";
import { orderStepSet, ordersReplaced, placeOrders, removeOrder, orderRestored, selectOrders } from "./ordersSlice.ts";
import { sharedReducers } from "./shared.ts";

const makeStore = () => configureStore({ reducer: combineReducers(sharedReducers), preloadedState: { catalog: { saved: null }, orders: { items: [] } } });
const customer = { name: "Pat", email: "pat@example.com" };
const row = (o: Partial<SkuRow> & { sku: string }): SkuRow => ({ name: "New thing", category: "Snacks", channel: "retail", price: 10, stock: 5, blurb: "", ...o }) as SkuRow;

test("the catalog starts as the built-in products and is not customized", () => {
  const s = makeStore().getState();
  assert.equal(selectProducts(s), seedProducts);
  assert.equal(selectCustomized(s), false);
});

test("editing a product changes only that product", () => {
  const store = makeStore();
  const first = seedProducts[0];
  store.dispatch(productUpdated({ id: first.id, edit: { name: "Renamed", price: 99, stock: 1, category: first.category, blurb: first.blurb, channel: first.channel, size: first.size, was: undefined, image: first.image } }));
  const products = selectProducts(store.getState());
  assert.equal(products[0].name, "Renamed");
  assert.equal(products[0].sku, first.sku);
  assert.equal(products[1].name, seedProducts[1].name);
  assert.equal(selectCustomized(store.getState()), true);
});

test("removing a product can be undone at the same position", () => {
  const store = makeStore();
  const gone = store.dispatch(removeProduct(seedProducts[2].id));
  assert.equal(gone?.index, 2);
  assert.equal(selectProducts(store.getState()).some((p) => p.id === gone?.product.id), false);
  store.dispatch(productRestored(gone!));
  assert.equal(selectProducts(store.getState())[2].id, seedProducts[2].id);
  assert.equal(store.dispatch(removeProduct("nope")), undefined);
});

test("importing SKUs adds new ones and updates existing ones by SKU", () => {
  const store = makeStore();
  const result = store.dispatch(importSkus([row({ sku: seedProducts[0].sku, name: "Updated", price: 1 }), row({ sku: "BRAND-NEW" })]));
  assert.deepEqual(result, { added: 1, updated: 1 });
  const products = selectProducts(store.getState());
  assert.equal(products.length, seedProducts.length + 1);
  assert.equal(products[0].name, "Updated");
  assert.equal(products.at(-1)?.id, "brand-new");
});

test("resetting the catalog goes back to the built-in products", () => {
  const store = makeStore();
  store.dispatch(removeProduct(seedProducts[0].id));
  store.dispatch(catalogReset());
  assert.equal(selectProducts(store.getState()), seedProducts);
});

test("categories are listed once each, in catalog order", () => {
  const cats = selectCategories(makeStore().getState());
  assert.equal(new Set(cats).size, cats.length);
  assert.equal(cats[0], seedProducts[0].category);
});

test("placing orders adds one order per channel, newest first, and returns them", () => {
  const store = makeStore();
  const made = store.dispatch(placeOrders(customer, [
    { channel: "retail", items: [{ id: "a", name: "A", qty: 2, price: 10 }] },
    { channel: "bulk", items: [] },
    { channel: "bulk", items: [{ id: "b", name: "B", qty: 1, price: 50 }] },
  ]));
  assert.equal(made.length, 2);
  const orders = selectOrders(store.getState());
  assert.deepEqual(orders.map((o) => o.id), [made[1].id, made[0].id]);
  assert.equal(orders[1].total, 20);
});

test("staff can change a status, delete an order and undo the delete", () => {
  const store = makeStore();
  const [order] = store.dispatch(placeOrders(customer, [{ channel: "retail", items: [{ id: "a", name: "A", qty: 1, price: 5 }] }]));
  store.dispatch(orderStepSet({ id: order.id, step: 2 }));
  assert.equal(selectOrders(store.getState())[0].step, 2);
  store.dispatch(orderStepSet({ id: order.id, step: 9 })); // invalid steps are ignored
  assert.equal(selectOrders(store.getState())[0].step, 2);

  const removed = store.dispatch(removeOrder(order.id));
  assert.equal(selectOrders(store.getState()).length, 0);
  store.dispatch(orderRestored(removed!));
  assert.equal(selectOrders(store.getState())[0].id, order.id);
  assert.equal(store.dispatch(removeOrder("ORD_0")), undefined);
});

test("orders from another tab replace the list", () => {
  const store = makeStore();
  const [order] = store.dispatch(placeOrders(customer, [{ channel: "retail", items: [{ id: "a", name: "A", qty: 1, price: 5 }] }]));
  store.dispatch(ordersReplaced([]));
  assert.equal(selectOrders(store.getState()).length, 0);
  store.dispatch(ordersReplaced([order]));
  assert.equal(selectOrders(store.getState())[0].id, order.id);
});
