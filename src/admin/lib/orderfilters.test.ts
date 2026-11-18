import assert from "node:assert/strict";
import { test } from "node:test";
import { SAMPLE_ORDERS, type Order } from "../../shared/lib/orderlogic.ts";
import { NO_FILTERS, citiesOf, dateBounds, isFiltering, matchesFilters, statesOf } from "./orderfilters.ts";

const shipping = (city: string, state = "MH") => ({ fullName: "A", phone: "9876543210", line1: "1 Rd", line2: "", city, state, pin: "411001" });
const order = (patch: Partial<Order>): Order => ({ ...SAMPLE_ORDERS[0], ...patch });
const TODAY = "2026-11-18";

test("date presets count back from today, and a custom range may be open on either end", () => {
  assert.deepEqual(dateBounds({ ...NO_FILTERS, date: "all" }, TODAY), {});
  assert.deepEqual(dateBounds({ ...NO_FILTERS, date: "today" }, TODAY), { from: TODAY, to: TODAY });
  assert.deepEqual(dateBounds({ ...NO_FILTERS, date: "7d" }, TODAY), { from: "2026-11-12", to: TODAY });
  assert.deepEqual(dateBounds({ ...NO_FILTERS, date: "30d" }, TODAY), { from: "2026-10-20", to: TODAY });
  assert.deepEqual(dateBounds({ date: "custom", from: "2026-11-01", to: "" }, TODAY), { from: "2026-11-01", to: undefined });
});

test("the date filter includes both end days", () => {
  const f = { ...NO_FILTERS, date: "custom" as const, from: "2026-11-14", to: "2026-11-16" };
  assert.ok(matchesFilters(order({ date: "2026-11-14" }), f, TODAY));
  assert.ok(matchesFilters(order({ date: "2026-11-16" }), f, TODAY));
  assert.ok(!matchesFilters(order({ date: "2026-11-13" }), f, TODAY));
  assert.ok(!matchesFilters(order({ date: "2026-11-17" }), f, TODAY));
  assert.ok(matchesFilters(order({ date: "2020-01-01" }), NO_FILTERS, TODAY));
});

test("order value bands split at 500 and 2,000", () => {
  const at = (total: number, value: "low" | "mid" | "high") => matchesFilters(order({ total }), { ...NO_FILTERS, value }, TODAY);
  assert.ok(at(499, "low") && !at(500, "low"));
  assert.ok(at(500, "mid") && at(2000, "mid") && !at(2001, "mid"));
  assert.ok(at(2001, "high") && !at(2000, "high"));
});

test("the city filter matches the delivery city, ignoring case, and skips orders with no address", () => {
  const f = { ...NO_FILTERS, city: "Pune" };
  assert.ok(matchesFilters(order({ shipping: shipping("pune") }), f, TODAY));
  assert.ok(!matchesFilters(order({ shipping: shipping("Delhi") }), f, TODAY));
  assert.ok(!matchesFilters(order({ shipping: undefined }), f, TODAY));
});

test("cities are listed once each, A to Z, and filtering is detected", () => {
  assert.deepEqual(citiesOf([order({ shipping: shipping("Pune") }), order({ shipping: shipping("Delhi") }), order({ shipping: shipping("Pune ") }), order({ shipping: undefined })]), ["Delhi", "Pune"]);
  assert.ok(!isFiltering(NO_FILTERS));
  assert.ok(isFiltering({ ...NO_FILTERS, city: "Pune" }));
});

test("the state filter matches the delivery state, ignoring case, and skips orders with no address", () => {
  const f = { ...NO_FILTERS, state: "maharashtra" };
  assert.ok(matchesFilters(order({ shipping: shipping("Pune", "Maharashtra") }), f, TODAY));
  assert.ok(!matchesFilters(order({ shipping: shipping("Delhi", "Delhi") }), f, TODAY));
  assert.ok(!matchesFilters(order({ shipping: undefined }), f, TODAY));
  assert.ok(!matchesFilters(order({ shipping: shipping("Pune", "Maharashtra") }), { ...f, city: "Mumbai" }, TODAY), "state and city must both match");
  assert.ok(isFiltering(f));
});

test("states are listed once each, A to Z, and a state narrows the city list", () => {
  const list = [order({ shipping: shipping("Pune", "Maharashtra") }), order({ shipping: shipping("Mumbai", "Maharashtra") }), order({ shipping: shipping("Delhi", "Delhi") }), order({ shipping: undefined })];
  assert.deepEqual(statesOf(list), ["Delhi", "Maharashtra"]);
  assert.deepEqual(citiesOf(list), ["Delhi", "Mumbai", "Pune"]);
  assert.deepEqual(citiesOf(list, "Maharashtra"), ["Mumbai", "Pune"]);
});
