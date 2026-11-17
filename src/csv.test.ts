// Run with `npm test` (Node's built-in test runner, no extra packages).
import assert from "node:assert/strict";
import { test } from "node:test";
import { orders, revenueOf, salesByDay } from "./data.ts";
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

test("the 7-day sales chart adds up to the revenue stat", () => {
  const total = salesByDay().reduce((s, d) => s + d.total, 0);
  assert.equal(total, revenueOf(orders));
});
