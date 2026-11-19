// Run with `npm test` (Node's built-in test runner, no extra packages).
import assert from "node:assert/strict";
import { test } from "node:test";
import { SAMPLE_ORDERS, isOrder, makeOrder, makeOrders, nextOrderId, orderTotal, revenueOf, withChannel, withOrderAt, withStep, withoutOrder, type Order } from "./orderlogic.ts";
import { deriveNameAndSize, parseCsv, parseSkuCsv, skuTemplate } from "./csv.ts";
import { emptyForm, isSafeImage, parseNewProduct, parseProductForm, toForm } from "./productform.ts";
import { seedProducts } from "./data.ts";

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
  assert.equal(parseSkuCsv("sku,name\nA,B").fatal, "Missing required column: Current Sales Price.");
  assert.equal(parseSkuCsv("PID,Brand\n1,Dove").fatal, "Missing required columns: SKU, Current Sales Price.");
  assert.equal(parseSkuCsv("").fatal, "The file is empty.");
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
  const order = makeOrder(SAMPLE_ORDERS, { name: "A", email: "a@b.co" }, items, "retail", "2026-11-17");
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

test("makeOrders splits retail and bulk items into separate sequential orders", () => {
  const retail = [{ id: "detergent", name: "Detergent", qty: 1, price: 249 }];
  const bulk = [{ id: "detergent-carton", name: "Detergent", qty: 1, price: 2699 }];
  const made = makeOrders(SAMPLE_ORDERS, { name: "A", email: "a@b.co" }, [{ channel: "retail", items: retail }, { channel: "bulk", items: bulk }], "2026-11-17");
  assert.deepEqual(made.map((o) => [o.id, o.channel, o.total]), [["ORD_1002", "retail", 249], ["ORD_1003", "bulk", 2699]]);
  assert.equal(makeOrders(SAMPLE_ORDERS, { name: "A", email: "a@b.co" }, [{ channel: "retail", items: [] }, { channel: "bulk", items: bulk }]).length, 1);
});

test("sample orders have a channel, and old saved orders get one from their items", () => {
  assert.ok(SAMPLE_ORDERS.some((o) => o.channel === "bulk") && SAMPLE_ORDERS.some((o) => o.channel === "retail"));
  const { channel: _drop, ...old } = SAMPLE_ORDERS.find((o) => o.channel === "bulk")!;
  assert.equal(isOrder(old), true);
  assert.equal(withChannel(old as Order).channel, "bulk");
});

test("the product edit form accepts valid values, rupee formatting and a blank photo", () => {
  const base = toForm(seedProducts[0]);
  const { value, errors } = parseProductForm({ ...base, name: "  Detergent Plus ", price: "₹1,249", was: "1,499", stock: "12", image: "" });
  assert.deepEqual(errors, {});
  assert.equal(value?.name, "Detergent Plus");
  assert.equal(value?.price, 1249);
  assert.equal(value?.was, 1499);
  assert.equal(value?.image, undefined);
});

test("the product edit form reports each bad field", () => {
  const base = toForm(seedProducts[0]);
  const { value, errors } = parseProductForm({ ...base, name: " ", price: "abc", stock: "2.5", was: "10", channel: "wholesale", image: "javascript:alert(1)" });
  assert.equal(value, undefined);
  assert.deepEqual(Object.keys(errors).sort(), ["channel", "image", "name", "price", "stock"]);
  assert.match(parseProductForm({ ...base, price: "500", was: "400" }).errors.was ?? "", /higher/);
});

test("isSafeImage allows https links and bundled files only", () => {
  assert.equal(isSafeImage("https://cdn.example.com/a.png"), true);
  assert.equal(isSafeImage("/products/detergent.jpg"), true);
  assert.equal(isSafeImage("javascript:alert(1)"), false);
  assert.equal(isSafeImage("data:image/png;base64,AAAA"), false);
  assert.equal(isSafeImage("/etc/passwd"), false);
});

test("deleting an order and undoing it restores the same list", () => {
  const index = SAMPLE_ORDERS.findIndex((o) => o.id === "ORD_0999");
  const gone = withoutOrder(SAMPLE_ORDERS, "ORD_0999");
  assert.equal(gone.length, SAMPLE_ORDERS.length - 1);
  assert.ok(!gone.some((o) => o.id === "ORD_0999"));
  const back = withOrderAt(gone, SAMPLE_ORDERS[index], index);
  assert.deepEqual(back.map((o) => o.id), SAMPLE_ORDERS.map((o) => o.id));
  assert.equal(withOrderAt(back, SAMPLE_ORDERS[index], index), back, "an order that is already there is not added twice");
  assert.equal(withoutOrder(SAMPLE_ORDERS, "ORD_9999").length, SAMPLE_ORDERS.length);
});

test("a new product needs a valid SKU on top of the usual fields", () => {
  const form = { ...emptyForm(), sku: " DET-002 ", name: "Detergent Pro", category: "Home care", price: "299", stock: "10" };
  const ok = parseNewProduct(form);
  assert.deepEqual(ok.errors, {});
  assert.equal(ok.value?.sku, "DET-002");
  assert.equal(ok.value?.channel, "retail");
  assert.ok(parseNewProduct({ ...form, sku: " " }).errors.sku);
  assert.ok(parseNewProduct({ ...form, sku: "has space" }).errors.sku);
  assert.ok(parseNewProduct({ ...form, sku: "x".repeat(41) }).errors.sku);
  const blank = parseNewProduct(emptyForm());
  assert.deepEqual(Object.keys(blank.errors).sort(), ["category", "name", "price", "sku", "stock"]);
  assert.equal(blank.value, undefined);
});

const SHEET_HEADER = "PID,Country,Business Group,Category,Brand,SubBrand,Segment,Form,SKU,Current Sales Price,system_id,location_id,quantity,uom,status";

test("the catalog sheet is read: name and size from the SKU, descriptive columns, stock locations", () => {
  const dove = "10001-Dove Intense Repair Shampoo 180ml";
  const { rows, issues, fatal } = parseSkuCsv([
    SHEET_HEADER,
    `${dove},India,Beauty & Well being,SHAMPOO,Dove,Intense Repair,ALL OTHER,Liquid,${dove},230,AUTOSTORE,AS_BIN_A,100,EA,AVAILABLE`,
    `${dove},India,Beauty & Well being,SHAMPOO,Dove,Intense Repair,ALL OTHER,Liquid,${dove},230,AUTOSTORE,AS_BIN_B,30,EA,BLOCKED`,
    "10014-Bru Gold Coffee 100g,India,Nutrition,INSTANT COFFEE,Bru,Gold,BEVERAGES - SPL,Coffee,10014-Bru Gold Coffee 100g,343,,,,,",
  ].join("\n"));
  assert.equal(fatal, undefined);
  assert.deepEqual(issues, []);
  assert.equal(rows.length, 2);
  const [d, b] = rows;
  assert.deepEqual([d.name, d.size, d.price, d.brand, d.subBrand, d.businessGroup, d.segment, d.form, d.country], ["Dove Intense Repair Shampoo", "180ml", 230, "Dove", "Intense Repair", "Beauty & Well being", "ALL OTHER", "Liquid", "India"]);
  assert.equal(d.stock, 100, "the blocked pallet does not count as sellable stock");
  assert.deepEqual(d.locations?.map((l) => l.status), ["AVAILABLE", "BLOCKED"]);
  assert.equal(b.stock, 0);
  assert.equal(b.locations, undefined);
});

test("the catalog sheet reports bad stock columns and repeated locations with their line numbers", () => {
  const { rows, issues } = parseSkuCsv([
    "SKU,Current Sales Price,system_id,location_id,quantity,status",
    "A-1,10,S,L1,-4,AVAILABLE",   // 2: negative quantity
    "A-2,10,S,L1,5,SOLD",         // 3: unknown status
    "A-3,10,S,L1,5,AVAILABLE",    // 4: fine
    "A-3,10,S,L1,5,AVAILABLE",    // 5: the same place twice
    "A-3,10,,,,",                 // 6: the same SKU again with no location
    "A-3,10,S,L2,7,hold",         // 7: another place: fine, and the status is read in any capitals
  ].join("\n"));
  assert.deepEqual(issues.map((i) => i.line), [2, 3, 5, 6]);
  assert.deepEqual(rows.map((r) => [r.sku, r.stock, r.locations?.length]), [["A-3", 5, 2]]);
});

test("names and sizes come from the SKU unless the sheet gives them, and the template reads cleanly", () => {
  assert.deepEqual(deriveNameAndSize("10014-Bru Gold Coffee 100g", "", ""), { name: "Bru Gold Coffee", size: "100g" });
  assert.deepEqual(deriveNameAndSize("10014-Bru Gold Coffee 100g", "Bru", "1 kg"), { name: "Bru", size: "1 kg" });
  assert.deepEqual(deriveNameAndSize("DET-002", "", ""), { name: "DET-002", size: undefined });
  const template = parseSkuCsv(skuTemplate());
  assert.deepEqual(template.issues, []);
  assert.equal(template.rows.length, 3);
  assert.equal(template.rows[0].locations?.length, 2);
});

test("semicolon-separated files, odd header spellings and unknown columns are fine", () => {
  const { rows, issues } = parseSkuCsv("sku;CURRENT-SALES-PRICE;sub brand;AUTOSTORE;SKU-001\n 10-Dove Soap 100g ;₹1,230;Fresh;x;y\n");
  assert.deepEqual(issues, []);
  assert.deepEqual([rows[0].sku, rows[0].price, rows[0].subBrand, rows[0].name], ["10-Dove Soap 100g", 1230, "Fresh", "Dove Soap"]);
});
