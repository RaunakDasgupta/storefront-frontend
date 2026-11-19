// Reads the catalog sheet (the spreadsheet of SKUs, prices and stock). The backend has the same rules in Python
// (app/services/catalog_sheet.py): keep the two in step. Free of runtime imports so it can run under `node --test`.
import type { Product, ProductMeta } from "./data";

/** Where a SKU's stock sits: the sheet's system_id, location_id, quantity, uom and status columns. Only AVAILABLE stock can be sold. */
export type StockLocation = { systemId: string; locationId: string; quantity: number; uom: string; status: string };

export type SkuRow = Pick<Product, "sku" | "name" | "category" | "price" | "was" | "stock" | "blurb" | "image" | "size" | "channel"> & ProductMeta & {
  /** When given, these are all of the SKU's stock locations and `stock` is the available total. */
  locations?: StockLocation[];
};
export type CsvIssue = { line: number; message: string };
export type ParseResult = { rows: SkuRow[]; issues: CsvIssue[]; fatal?: string };

export const MAX_ROWS = 1000;

/** Guards import rows that come back from an API instead of a CSV file. */
export function isSkuRow(r: unknown): r is SkuRow {
  const x = r as SkuRow;
  return !!x && typeof x.sku === "string" && typeof x.name === "string" && typeof x.category === "string" && typeof x.blurb === "string" &&
    Number.isFinite(x.price) && Number.isFinite(x.stock) && (x.channel === "retail" || x.channel === "bulk") &&
    (x.size === undefined || typeof x.size === "string") && (x.was === undefined || Number.isFinite(x.was)) && (x.image === undefined || typeof x.image === "string");
}

/** RFC 4180-style parser: quoted fields, escaped quotes, delimiters and newlines inside quotes, CRLF, BOM. */
export function parseCsv(text: string, delimiter = ","): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delimiter) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      rows.push(row); row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

export const STATUSES = ["AVAILABLE", "BLOCKED", "DAMAGED", "HOLD", "QUARANTINE"];

/** The columns we understand, and the field each fills. Header names ignore capitals, and spaces, dashes and underscores are interchangeable. */
const ALIASES: Record<string, string> = {
  sku: "sku", pid: "pid", country: "country", business_group: "businessGroup", businessgroup: "businessGroup", category: "category", brand: "brand",
  sub_brand: "subBrand", subbrand: "subBrand", segment: "segment", form: "form",
  current_sales_price: "price", sales_price: "price", price: "price",
  name: "name", size: "size", channel: "channel", type: "channel",
  compare_at_price: "was", compare_at: "was", was: "was",
  description: "blurb", blurb: "blurb", logo_url: "image", logo: "image", image_url: "image", image: "image",
  stock: "stock",
  system_id: "systemId", location_id: "locationId", quantity: "quantity", qty: "quantity", uom: "uom", status: "status",
};
const REQUIRED: Record<string, string> = { sku: "SKU", price: "Current Sales Price" };
const STOCK_COLUMNS = ["systemId", "locationId", "quantity", "uom", "status"];

const normaliseHeader = (cell: string) => ALIASES[cell.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "")] ?? "";
const toNumber = (raw: string) => Number(raw.replace(/[₹,\s]/g, ""));

function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}
const isSafeLogo = (v: string) => /^\/products\/[\w.-]+$/.test(v) || isHttpUrl(v);

const SIZE_AT_END = /\s+(\d+(?:\.\d+)?\s?(?:ml|ltr|l|gm|g|kg|pcs|pc|pack|sheets|rolls))\s*$/i;

/** '10014-Bru Gold Coffee 100g' becomes the name 'Bru Gold Coffee' and the size '100g', unless the sheet says otherwise. */
export function deriveNameAndSize(sku: string, name: string, size: string): { name: string; size?: string } {
  if (name) return { name, size: size || undefined };
  let derived = sku.replace(/^\s*\d+\s*[-_:]\s*/, "").trim() || sku;
  if (!size) {
    const found = SIZE_AT_END.exec(derived);
    if (found) { size = found[1].replace(/\s/g, ""); derived = derived.slice(0, found.index).trim() || derived; }
  }
  return { name: derived, size: size || undefined };
}

const availableOf = (locations: StockLocation[]) => locations.filter((l) => l.status.toUpperCase() === "AVAILABLE").reduce((n, l) => n + l.quantity, 0);

/** The delimiter that appears most in the header line: comma, semicolon or tab (Excel in some regions saves semicolons). */
const detectDelimiter = (text: string) => [",", ";", "\t"].reduce((best, d) => (text.split("\n", 1)[0].split(d).length > text.split("\n", 1)[0].split(best).length ? d : best), ",");

/**
 * Validates the catalog sheet. One row per SKU, or one row per SKU and stock location (the same SKU again adds a location).
 * SKU and Current Sales Price are required. A bad row is skipped and reported with its spreadsheet line number.
 */
export function parseSkuCsv(text: string): ParseResult {
  const table = parseCsv(text, detectDelimiter(text));
  if (table.length === 0) return { rows: [], issues: [], fatal: "The file is empty." };

  const columns = table[0].map(normaliseHeader);
  const missing = Object.entries(REQUIRED).filter(([key]) => !columns.includes(key)).map(([, label]) => label);
  if (missing.length) return { rows: [], issues: [], fatal: `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.` };
  if (table.length - 1 > MAX_ROWS) return { rows: [], issues: [], fatal: `The file has more than ${MAX_ROWS} rows. Split it and upload each part.` };

  const hasStockColumns = STOCK_COLUMNS.some((c) => columns.includes(c));
  const issues: CsvIssue[] = [];
  const bySku = new Map<string, SkuRow>();

  table.slice(1).forEach((raw, i) => {
    const line = i + 2; // spreadsheet-style: the header is row 1
    const fail = (message: string) => { issues.push({ line, message }); };
    const cell = (key: string) => { const at = columns.indexOf(key); return at < 0 ? "" : (raw[at] ?? "").trim(); };

    const sku = cell("sku");
    if (!sku) return fail("SKU is empty.");
    if (sku.length > 120) return fail(`${sku.slice(0, 30)}...: SKU is longer than 120 characters.`);

    // where the stock sits (optional)
    let location: StockLocation | undefined;
    if (STOCK_COLUMNS.some((c) => cell(c))) {
      const quantityRaw = cell("quantity");
      const quantity = quantityRaw === "" ? 0 : toNumber(quantityRaw);
      if (!Number.isInteger(quantity) || quantity < 0) return fail(`${sku}: quantity must be a whole number, like 25.`);
      const status = (cell("status") || "AVAILABLE").toUpperCase();
      if (!STATUSES.includes(status)) return fail(`${sku}: status must be one of ${STATUSES.join(", ")}.`);
      const uom = (cell("uom") || "EA").toUpperCase();
      if (uom.length > 10 || cell("systemId").length > 40 || cell("locationId").length > 60) return fail(`${sku}: system_id, location_id or uom is too long.`);
      location = { systemId: cell("systemId") || "DEFAULT", locationId: cell("locationId") || "DEFAULT", quantity, uom, status };
    }

    // a SKU that appeared before: only another stock location is allowed
    const existing = bySku.get(sku.toLowerCase());
    if (existing) {
      if (!location) return fail(`${sku}: duplicate SKU in this file, the first row was used.`);
      const taken = (existing.locations ?? []).some((l) => l.systemId.toLowerCase() === location!.systemId.toLowerCase() && l.locationId.toLowerCase() === location!.locationId.toLowerCase());
      if (taken) return fail(`${sku}: this location (${location.systemId} / ${location.locationId}) is listed twice.`);
      existing.locations = [...(existing.locations ?? []), location];
      existing.stock = availableOf(existing.locations);
      return;
    }

    // the product itself
    const priceRaw = cell("price");
    const price = priceRaw === "" ? NaN : toNumber(priceRaw);
    if (!Number.isFinite(price) || price < 0) return fail(`${sku}: current sales price must be a number, like 249.`);

    const { name, size } = deriveNameAndSize(sku, cell("name"), cell("size"));
    if (name.length > 120) return fail(`${sku}: name is longer than 120 characters.`);
    if (size && size.length > 60) return fail(`${sku}: size is longer than 60 characters.`);

    const wasRaw = cell("was");
    const was = wasRaw === "" ? undefined : toNumber(wasRaw);
    if (was !== undefined && (!Number.isFinite(was) || was < 0)) return fail(`${sku}: compare at price must be a number.`);

    const channel = (cell("channel") || "retail").toLowerCase();
    if (channel !== "retail" && channel !== "bulk") return fail(`${sku}: channel must be retail or bulk.`);

    const logo = cell("image");
    if (logo && !isSafeLogo(logo)) return fail(`${sku}: logo_url must be a full https link or a /products/ file.`);

    const blurb = cell("blurb");
    if (blurb.length > 500) return fail(`${sku}: description is longer than 500 characters.`);

    let stock = 0;
    if (!location && !hasStockColumns) {
      const stockRaw = cell("stock");
      stock = stockRaw === "" ? 0 : toNumber(stockRaw);
      if (!Number.isInteger(stock) || stock < 0) return fail(`${sku}: stock must be a whole number, like 25.`);
    }

    const optional = (key: string) => cell(key) || undefined;
    const row: SkuRow = {
      sku, name, size, price, category: cell("category") || "General", channel: channel as "retail" | "bulk", stock, blurb,
      was: was !== undefined && was > price ? was : undefined, // only a higher "was" price makes sense
      image: logo || undefined,
      pid: optional("pid"), country: optional("country"), businessGroup: optional("businessGroup"), brand: optional("brand"),
      subBrand: optional("subBrand"), segment: optional("segment"), form: optional("form"),
      locations: location ? [location] : undefined,
    };
    if (row.locations) row.stock = availableOf(row.locations);
    bySku.set(sku.toLowerCase(), row);
  });

  return { rows: [...bySku.values()], issues };
}

/** The example file people download: the catalog sheet's columns with a few filled-in rows (the second Dove row is another stock location). */
export const skuTemplate = () =>
  [
    "PID,Country,Business Group,Category,Brand,SubBrand,Segment,Form,SKU,Current Sales Price,system_id,location_id,quantity,uom,status",
    "10001-Dove Intense Repair Shampoo 180ml,India,Beauty & Well being,SHAMPOO,Dove,Intense Repair,ALL OTHER,Liquid,10001-Dove Intense Repair Shampoo 180ml,230,AUTOSTORE,AS_BIN_A,120,EA,AVAILABLE",
    "10001-Dove Intense Repair Shampoo 180ml,India,Beauty & Well being,SHAMPOO,Dove,Intense Repair,ALL OTHER,Liquid,10001-Dove Intense Repair Shampoo 180ml,230,AUTOSTORE,AS_BIN_B,40,EA,AVAILABLE",
    "10014-Bru Gold Coffee 100g,India,Nutrition,INSTANT COFFEE,Bru,Gold,BEVERAGES - SPL,Coffee,10014-Bru Gold Coffee 100g,343,AUTOSTORE,AS_BIN_A,60,EA,AVAILABLE",
    "10020-Domex Original Toilet Cleaner 500ml,India,Home Care,HHC,Domex,Original,HOME HYGIENE,Liquid,10020-Domex Original Toilet Cleaner 500ml,220,AUTOSTORE,AS_BIN_A,95,EA,AVAILABLE",
  ].join("\n") + "\n";
