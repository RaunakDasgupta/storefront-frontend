// The customer store: cart, checkout, auth and the login popup.
import assert from "node:assert/strict";
import { test } from "node:test";
import { seedProducts } from "../../shared/lib/data.ts";
import { selectOrders } from "../../shared/store/ordersSlice.ts";
import { dialogClosed, dialogModeChanged, dialogOpened } from "./authDialogSlice.ts";
import { selectUser, signIn, signUp, signedOut } from "./authSlice.ts";
import { cartCleared, itemAdded, qtySet, selectCartCount, selectCartItems, selectCartTotal } from "./cartSlice.ts";
import { checkout } from "./checkout.ts";
import { checkoutOpened, addressSaved } from "./checkoutSlice.ts";
import { EMPTY_ADDRESS, DECLINED_CARD, TEST_CARD, luhnValid, payWithCard, validateAddress, validateCard } from "./gateway.ts";
import { makeCustomerStore } from "./store.ts";

// the mock accounts live in localStorage: give the tests an empty in-memory one
const data = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v), removeItem: (k: string) => void data.delete(k) },
});

const retail = seedProducts.find((p) => p.channel === "retail")!;
const bulk = seedProducts.find((p) => p.channel === "bulk")!;
const makeStore = () => makeCustomerStore({ orders: { items: [] } });

test("the cart adds, merges, changes and removes lines", () => {
  const store = makeStore();
  store.dispatch(itemAdded({ id: retail.id, qty: 1 }));
  store.dispatch(itemAdded({ id: retail.id, qty: 2 }));
  assert.equal(selectCartCount(store.getState()), 3);
  assert.equal(selectCartTotal(store.getState()), retail.price * 3);
  store.dispatch(qtySet({ id: retail.id, qty: 1 }));
  assert.equal(selectCartCount(store.getState()), 1);
  store.dispatch(qtySet({ id: retail.id, qty: 0 }));
  assert.equal(selectCartItems(store.getState()).length, 0);
});

test("a cart line for a product that no longer exists is left out of the items", () => {
  const store = makeStore();
  store.dispatch(itemAdded({ id: "gone", qty: 1 }));
  assert.equal(selectCartItems(store.getState()).length, 0);
  assert.equal(selectCartTotal(store.getState()), 0);
});

const address = { fullName: "Pat Doe", phone: "98765 43210", line1: "12 MG Road", line2: "", city: "Pune", state: "Maharashtra", pin: "411001" };
const pat = { name: "Pat", email: "pat@example.com" };

test("checkout splits retail and bulk into two orders with the address, empties the cart and shows the receipt", () => {
  const store = makeStore();
  store.dispatch(itemAdded({ id: retail.id, qty: 2 }));
  store.dispatch(itemAdded({ id: bulk.id, qty: 1 }));
  store.dispatch(checkout(pat, address, "PAY_TEST"));
  const orders = selectOrders(store.getState());
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

test("checkout with an empty cart places nothing and closes the popup", () => {
  const store = makeStore();
  store.dispatch(checkoutOpened());
  store.dispatch(checkout(pat, address, "PAY_TEST"));
  assert.equal(selectOrders(store.getState()).length, 0);
  assert.equal(store.getState().checkout.stage, "closed");
});

test("the checkout popup moves from address to payment and keeps the address", () => {
  const store = makeStore();
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

test("the dummy gateway approves the test card and declines the decline card", async () => {
  const card = { number: TEST_CARD, name: "Pat", expiry: "12/30", cvc: "123" };
  const ok = await payWithCard(card, 0);
  assert.ok(ok.ok && /^PAY_[0-9A-F]{8}$/.test(ok.ref));
  const declined = await payWithCard({ ...card, number: DECLINED_CARD }, 0);
  assert.ok(!declined.ok && /declined/.test(declined.message));
});

test("signing in works for the demo account and fails with a message otherwise", async () => {
  const store = makeStore();
  await assert.rejects(store.dispatch(signIn({ email: "customer@storefront.test", password: "nope" })).unwrap(), /incorrect/);
  assert.equal(selectUser(store.getState()), null);
  await store.dispatch(signIn({ email: " Customer@Storefront.test ", password: "customer123" })).unwrap();
  assert.equal(selectUser(store.getState())?.name, "Alex Morgan");
  store.dispatch(signedOut());
  assert.equal(selectUser(store.getState()), null);
});

test("signing up signs the customer in and refuses a second account with the same email", async () => {
  const store = makeStore();
  await store.dispatch(signUp({ name: "Pat Lee", email: "Pat@Example.com", password: "longenough" })).unwrap();
  assert.equal(selectUser(store.getState())?.email, "pat@example.com");
  await assert.rejects(store.dispatch(signUp({ name: "Other", email: "pat@example.com", password: "longenough" })).unwrap(), /already exists/);
  await assert.rejects(store.dispatch(signUp({ name: "Other", email: "customer@storefront.test", password: "longenough" })).unwrap(), /already exists/);
});

test("the login popup opens in a mode, switches mode and closes", () => {
  const store = makeStore();
  store.dispatch(dialogOpened({ mode: "login", reason: "place your order", after: { kind: "checkout" } }));
  store.dispatch(dialogModeChanged("signup"));
  assert.deepEqual(store.getState().authDialog.request, { mode: "signup", reason: "place your order", after: { kind: "checkout" } });
  store.dispatch(dialogClosed());
  assert.equal(store.getState().authDialog.request, null);
});
