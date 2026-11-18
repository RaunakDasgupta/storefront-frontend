// The customer store: cart, checkout, auth and the login popup.
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Api } from "../../shared/api/types.ts";
import { DECLINED_CARD, TEST_CARD } from "../../shared/api/mock.ts";
import { testApi } from "../../shared/api/testing.ts";
import { seedProducts } from "../../shared/lib/data.ts";
import { loadCatalog } from "../../shared/store/catalogSlice.ts";
import { loadOrders, selectOrders } from "../../shared/store/ordersSlice.ts";
import { dialogClosed, dialogModeChanged, dialogOpened } from "./authDialogSlice.ts";
import { selectUser, signIn, signUp, signedOut } from "./authSlice.ts";
import { cartCleared, itemAdded, qtySet, selectCartCount, selectCartItems, selectCartTotal } from "./cartSlice.ts";
import { checkout, payAndCheckout } from "./checkout.ts";
import { addressSaved, checkoutOpened } from "./checkoutSlice.ts";
import { EMPTY_ADDRESS, luhnValid, validateAddress, validateCard } from "./gateway.ts";
import { makeCustomerStore } from "./store.ts";

const retail = seedProducts.find((p) => p.channel === "retail")!;
const bulk = seedProducts.find((p) => p.channel === "bulk")!;
/** A store on the mock API with the catalog loaded, like the storefront after its first screen. */
async function makeStore(api: Api = testApi()) {
  const store = makeCustomerStore(api);
  await store.dispatch(loadCatalog());
  await store.dispatch(loadOrders());
  return store;
}

test("the cart adds, merges, changes and removes lines", async () => {
  const store = await makeStore();
  store.dispatch(itemAdded({ id: retail.id, qty: 1 }));
  store.dispatch(itemAdded({ id: retail.id, qty: 2 }));
  assert.equal(selectCartCount(store.getState()), 3);
  assert.equal(selectCartTotal(store.getState()), retail.price * 3);
  store.dispatch(qtySet({ id: retail.id, qty: 1 }));
  assert.equal(selectCartCount(store.getState()), 1);
  store.dispatch(qtySet({ id: retail.id, qty: 0 }));
  assert.equal(selectCartItems(store.getState()).length, 0);
});

test("a cart line for a product that no longer exists is left out of the items", async () => {
  const store = await makeStore();
  store.dispatch(itemAdded({ id: "gone", qty: 1 }));
  assert.equal(selectCartItems(store.getState()).length, 0);
  assert.equal(selectCartTotal(store.getState()), 0);
});

const address = { fullName: "Pat Doe", phone: "98765 43210", line1: "12 MG Road", line2: "", city: "Pune", state: "Maharashtra", pin: "411001" };
const pat = { name: "Pat", email: "pat@example.com" };

test("checkout splits retail and bulk into two orders with the address, empties the cart and shows the receipt", async () => {
  const store = await makeStore();
  const before = selectOrders(store.getState()).length;
  store.dispatch(itemAdded({ id: retail.id, qty: 2 }));
  store.dispatch(itemAdded({ id: bulk.id, qty: 1 }));
  await store.dispatch(checkout(pat, address, "PAY_TEST"));
  const orders = selectOrders(store.getState()).slice(0, 2);
  assert.equal(selectOrders(store.getState()).length, before + 2);
  assert.deepEqual(orders.map((o) => o.channel).sort(), ["bulk", "retail"]);
  assert.equal(orders.find((o) => o.channel === "retail")?.total, retail.price * 2);
  assert.deepEqual(orders.map((o) => o.shipping), [address, address]);
  assert.equal(selectCartCount(store.getState()), 0);
  const { stage, receipt } = store.getState().checkout;
  assert.equal(stage, "placed");
  assert.equal(receipt?.paid, retail.price * 2 + bulk.price);
  assert.equal(receipt?.paymentRef, "PAY_TEST");
  assert.equal(receipt?.orderIds.length, 2);
});

test("checkout with an empty cart places nothing and closes the popup", async () => {
  const store = await makeStore();
  const before = selectOrders(store.getState()).length;
  store.dispatch(checkoutOpened());
  await store.dispatch(checkout(pat, address, "PAY_TEST"));
  assert.equal(selectOrders(store.getState()).length, before);
  assert.equal(store.getState().checkout.stage, "closed");
});

test("a failed order keeps the cart and the popup, and says so", async () => {
  const api = testApi();
  api.orders.create = async () => { throw new Error("Out of stock."); };
  const store = await makeStore(api);
  store.dispatch(itemAdded({ id: retail.id, qty: 1 }));
  await assert.rejects(store.dispatch(checkout(pat, address, "PAY_TEST")), /Out of stock/);
  assert.equal(selectCartCount(store.getState()), 1);
});

test("paying: a declined card stops the checkout, an approved one places the order", async () => {
  const store = await makeStore();
  store.dispatch(itemAdded({ id: retail.id, qty: 1 }));
  const card = { number: TEST_CARD, name: "Pat", expiry: "12/39", cvc: "123" };
  const declined = await store.dispatch(payAndCheckout(pat, address, { ...card, number: DECLINED_CARD }));
  assert.match(declined ?? "", /declined/);
  assert.equal(selectCartCount(store.getState()), 1, "nothing was ordered");
  assert.equal(await store.dispatch(payAndCheckout(pat, address, card)), null);
  assert.equal(store.getState().checkout.stage, "placed");
  assert.match(store.getState().checkout.receipt?.paymentRef ?? "", /^PAY_[0-9A-F]{8}$/);
});

test("paying: if the order fails after the card was charged, the message carries the payment reference", async () => {
  const api = testApi();
  api.orders.create = async () => { throw new Error("Server error."); };
  const store = await makeStore(api);
  store.dispatch(itemAdded({ id: retail.id, qty: 1 }));
  const message = await store.dispatch(payAndCheckout(pat, address, { number: TEST_CARD, name: "Pat", expiry: "12/39", cvc: "123" }));
  assert.match(message ?? "", /PAY_[0-9A-F]{8}.*Server error/);
});

test("the checkout popup moves from address to payment and keeps the address", async () => {
  const store = await makeStore();
  store.dispatch(checkoutOpened());
  assert.equal(store.getState().checkout.stage, "address");
  store.dispatch(addressSaved(address));
  assert.equal(store.getState().checkout.stage, "payment");
  assert.deepEqual(store.getState().checkout.address, address);
});

test("address and card checks catch bad input and accept good input", () => {
  assert.deepEqual(Object.keys(validateAddress(EMPTY_ADDRESS)).sort(), ["city", "fullName", "line1", "phone", "pin", "state"]);
  assert.deepEqual(validateAddress(address), {});
  assert.ok(validateAddress({ ...address, pin: "01234" }).pin);
  assert.ok(luhnValid(TEST_CARD));
  assert.ok(!luhnValid("4242 4242 4242 4243"));
  const good = { number: TEST_CARD, name: "Pat", expiry: "12/30", cvc: "123" };
  const now = new Date(2026, 5, 15);
  assert.deepEqual(validateCard(good, now), {});
  assert.ok(validateCard({ ...good, expiry: "05/26" }, now).expiry, "an expired month is rejected");
  assert.deepEqual(validateCard({ ...good, expiry: "06/26" }, now), {}, "the current month is still valid");
  assert.ok(validateCard({ ...good, expiry: "13/30" }, now).expiry);
});

test("signing in works for the demo account and fails with a message otherwise", async () => {
  const store = await makeStore();
  await assert.rejects(store.dispatch(signIn({ email: "customer@storefront.test", password: "nope" })).unwrap(), /incorrect/);
  assert.equal(selectUser(store.getState()), null);
  await store.dispatch(signIn({ email: " Customer@Storefront.test ", password: "customer123" })).unwrap();
  assert.equal(selectUser(store.getState())?.name, "Alex Morgan");
  store.dispatch(signedOut());
  assert.equal(selectUser(store.getState()), null);
});

test("signing up signs the customer in and refuses a second account with the same email", async () => {
  const store = await makeStore();
  await store.dispatch(signUp({ name: "Pat Lee", email: "Pat@Example.com", password: "longenough" })).unwrap();
  assert.equal(selectUser(store.getState())?.email, "pat@example.com");
  await assert.rejects(store.dispatch(signUp({ name: "Other", email: "pat@example.com", password: "longenough" })).unwrap(), /already exists/);
  await assert.rejects(store.dispatch(signUp({ name: "Other", email: "customer@storefront.test", password: "longenough" })).unwrap(), /already exists/);
});

test("the login popup opens in a mode, switches mode and closes", async () => {
  const store = await makeStore();
  store.dispatch(dialogOpened({ mode: "login", reason: "place your order", after: { kind: "checkout" } }));
  store.dispatch(dialogModeChanged("signup"));
  assert.deepEqual(store.getState().authDialog.request, { mode: "signup", reason: "place your order", after: { kind: "checkout" } });
  store.dispatch(dialogClosed());
  assert.equal(store.getState().authDialog.request, null);
});
