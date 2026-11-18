// Parses SKU CSV uploads. Kept free of runtime imports so it can run under `node --test`.
import type { Product } from "./data";

export type SkuRow = Pick<Product, "sku" | "name" | "category" | "price" | "was" | "stock" | "blurb" | "image" | "size" | "channel">;
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

/** RFC 4180-style parser: quoted fields, escaped quotes, commas and newlines inside quotes, CRLF, BOM. */
export function parseCsv(text: string): string[][] {
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
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      rows.push(row); row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

const ALIASES: Record<string, string> = { logo: "logo_url", image: "logo_url", image_url: "logo_url", description: "description", compare_at: "compare_at_price" };
const REQUIRED = ["sku", "name", "price"];

const toNumber = (raw: string) => Number(raw.replace(/[₹,\s]/g, ""));

function isHttpUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

/** Validates a SKU CSV. Header names are case-insensitive; sku, name and price are required. */
export function parseSkuCsv(text: string): ParseResult {
  const table = parseCsv(text);
  if (table.length === 0) return { rows: [], issues: [], fatal: "The file is empty." };

  const header = table[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_")).map((h) => ALIASES[h] ?? h);
  const missing = REQUIRED.filter((c) => !header.includes(c));
  if (missing.length) return { rows: [], issues: [], fatal: `Missing required column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}.` };
  if (table.length - 1 > MAX_ROWS) return { rows: [], issues: [], fatal: `The file has more than ${MAX_ROWS} rows. Split it and upload each part.` };

  const col = (r: string[], name: string) => (r[header.indexOf(name)] ?? "").trim();
  const rows: SkuRow[] = [];
  const issues: CsvIssue[] = [];
  const seen = new Set<string>();

  table.slice(1).forEach((r, i) => {
    const line = i + 2; // spreadsheet-style: the header is row 1
    const fail = (message: string) => issues.push({ line, message });

    const sku = col(r, "sku");
    const name = col(r, "name");
    if (!sku) return fail("SKU is empty.");
    if (!name) return fail(`${sku}: name is empty.`);
    if (name.length > 120) return fail(`${sku}: name is longer than 120 characters.`);
    if (seen.has(sku.toLowerCase())) return fail(`${sku}: duplicate SKU in this file, the first row was used.`);

    const price = toNumber(col(r, "price"));
    if (!Number.isFinite(price) || price < 0 || col(r, "price") === "") return fail(`${sku}: price must be a number, like 1499.`);

    const stockRaw = col(r, "stock");
    const stock = stockRaw === "" ? 0 : toNumber(stockRaw);
    if (!Number.isInteger(stock) || stock < 0) return fail(`${sku}: stock must be a whole number, like 25.`);

    const wasRaw = col(r, "compare_at_price");
    const was = wasRaw === "" ? undefined : toNumber(wasRaw);
    if (was !== undefined && (!Number.isFinite(was) || was < 0)) return fail(`${sku}: compare_at_price must be a number.`);

    const logo = col(r, "logo_url");
    if (logo && !isHttpUrl(logo)) return fail(`${sku}: logo_url must be a full http(s) link.`);

    const channelRaw = col(r, "channel").toLowerCase();
    if (channelRaw && channelRaw !== "retail" && channelRaw !== "bulk") return fail(`${sku}: channel must be retail or bulk.`);

    const size = col(r, "size");
    if (size.length > 60) return fail(`${sku}: size is longer than 60 characters.`);

    const blurb = col(r, "description");
    if (blurb.length > 500) return fail(`${sku}: description is longer than 500 characters.`);

    seen.add(sku.toLowerCase());
    rows.push({
      sku, name, price,
      category: col(r, "category") || "General",
      was: was !== undefined && was > price ? was : undefined,
      stock, blurb,
      size: size || undefined,
      channel: channelRaw === "bulk" ? "bulk" : "retail",
      image: logo || undefined,
    });
  });

  return { rows, issues };
}

/** Example file. `origin` makes the logo links point at photos this app already serves. */
export const skuTemplate = (origin: string) =>
  [
    "sku,name,size,category,channel,price,compare_at_price,stock,description,logo_url",
    `DSH-001,Dishwash liquid,750 ml,Home care,retail,129,,40,"Lemon dishwash liquid, cuts grease fast",${origin}/products/glass-cleaner.jpg`,
    `HND-002,Hand wash refill,1 L,Personal care,retail,189,229,25,Refill pouch for pump bottles,${origin}/products/hand-wash.jpg`,
    `BLK-GLS-12,Glass cleaner,Carton of 12 x 500 ml,Home care,bulk,1399,,10,Twelve 500 ml bottles per carton,${origin}/products/glass-cleaner.jpg`,
  ].join("\n") + "\n";
