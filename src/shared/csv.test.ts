// Run with `npm test` (Node's built-in test runner, no extra packages).
import assert from "node:assert/strict";
import { test } from "node:test";
import { SAMPLE_ORDERS, isOrder, makeOrder, nextOrderId, orderTotal, revenueOf, withStep } from "./orderlogic.ts";
import { parseCsv, parseSkuCsv } from "./csv.ts";

test("parseCsv handles quotes, escaped quotes, newlines in cells, CRLF and a BOM", () => {
  const text = '﻿a,b,c\r\n"x, y","say ""hi""","line1\nline2"\r\n\r\n';
  assert.deepEqual(parseCsv(text), [["a", "b", "c"], ["x, y", 'say "hi"', "line1\nline2"]]);
});

test("parseSkuCsv accepts valid rows, rupee symbols, aliases and optional columns", () => {
  const { rows, issues, fatal } = parseSkuCsv(
    'SKU,Name,Price,Logo\nA-1,Tote,"₹1,499",https://cdn.example.com/a.png\nA-2,Mug,799,\n',
  );
  assert.equal(fatal, undefined);
  assert.deepEqual(issues, []);
  assert.equal(rows[0].price, 1499);
  assert.equal(rows[0].image, "https://cdn.example.com/a.png");
  assert.equal(rows[1].image, undefined);
  assert.equal(rows[1].category, "General");
  assert.equal(rows[1].stock, 0);
  assert.equal(rows[1].channel, "retail");
});

test("parseSkuCsv reads size and channel and rejects an unknown channel", () => {
  const { rows, issues } = parseSkuCsv("sku,name,price,size,channel\nA,Pack,100,Carton of 12,BULK\nB,Odd,100,,wholesale\n");
  assert.equal(rows[0].channel, "bulk");
  assert.equal(rows[0].size, "Carton of 12");
  assert.deepEqual(issues.map((i) => i.line), [3]);
});

test("parseSkuCsv reports a missing required column", () => {
  assert.match(parseSkuCsv("sku,name\nA,B").fatal ?? "", /price/);
});

test("parseSkuCsv flags bad rows with their line number and keeps the good ones", () => {
  const csv = [
    "sku,name,price,stock,logo_url",
    "A,Ok,10,5,",
    "B,Bad price,abc,5,",
    "C,Bad stock,10,2.5,",
    "D,Bad logo,10,1,javascript:alert(1)",
    "A,Duplicate,10,1,",
    ",No sku,10,1,",
  ].join("\n");
  const { rows, issues } = parseSkuCsv(csv);
  assert.deepEqual(rows.map((r) => r.sku), ["A"]);
  assert.deepEqual(issues.map((i) => i.line), [3, 4, 5, 6, 7]);
});

test("compare_at_price is kept only when it is higher than the price", () => {
  const { rows } = parseSkuCsv("sku,name,price,compare_at_price\nA,X,100,150\nB,Y,100,90\n");
  assert.equal(rows[0].was, 150);
  assert.equal(rows[1].was, undefined);
});

test("a new order gets the next id, a total from its items, and starts at Confirmed", () => {
  assert.equal(nextOrderId(SAMPLE_ORDERS), "ORD_1002");
  const items = [{ id: "detergent", name: "Detergent", qty: 2, price: 249 }, { id: "shampoo", name: "Shampoo", qty: 1, price: 199 }];
  const order = makeOrder(SAMPLE_ORDERS, { name: "A", email: "a@b.co" }, items, "2026-11-17");
  assert.equal(order.id, "ORD_1002");
  assert.equal(order.total, 697);
  assert.equal(order.step, 0);
  assert.equal(nextOrderId([order, ...SAMPLE_ORDERS]), "ORD_1003");
});

test("sample orders are valid and their totals match their items", () => {
  assert.ok(SAMPLE_ORDERS.every(isOrder));
  assert.ok(SAMPLE_ORDERS.every((o) => o.total === orderTotal(o.items)));
  assert.equal(revenueOf(SAMPLE_ORDERS), SAMPLE_ORDERS.reduce((s, o) => s + o.total, 0));
});

test("isOrder rejects malformed stored data", () => {
  assert.equal(isOrder({ id: "x" }), false);
  assert.equal(isOrder(null), false);
});

test("withStep moves one order and ignores unknown ids or invalid steps", () => {
  const next = withStep(SAMPLE_ORDERS, "ORD_1000", 3);
  assert.equal(next.find((o) => o.id === "ORD_1000")?.step, 3);
  assert.equal(next.find((o) => o.id === "ORD_1001")?.step, SAMPLE_ORDERS.find((o) => o.id === "ORD_1001")?.step);
  assert.equal(SAMPLE_ORDERS.find((o) => o.id === "ORD_1000")?.step, 0, "the original list is not mutated");
  assert.equal(withStep(SAMPLE_ORDERS, "ORD_1000", 7), SAMPLE_ORDERS);
  assert.equal(withStep(SAMPLE_ORDERS, "ORD_9999", 2).length, SAMPLE_ORDERS.length);
});
