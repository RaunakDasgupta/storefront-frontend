// Pure product helpers, shared by the catalog slice, the mock API and tests. No React, no Redux.
import type { SkuRow } from "./csv.ts";
import type { Product } from "./data.ts";
import { isSafeImage } from "./productform.ts";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "sku";

/** Guards what comes back from an API or from localStorage, which anything on this origin could have edited. */
export function isProduct(p: unknown): p is Product {
  const x = p as Product;
  return !!x && typeof x.id === "string" && typeof x.sku === "string" && typeof x.name === "string" &&
    Number.isFinite(x.price) && Number.isFinite(x.stock) && typeof x.category === "string" && typeof x.blurb === "string" &&
    (x.image === undefined || isSafeImage(x.image)) && (x.channel === "retail" || x.channel === "bulk") && (x.size === undefined || typeof x.size === "string") && (x.was === undefined || Number.isFinite(x.was));
}

/** Adds new SKUs and updates existing ones (matched by SKU). A CSV import never deletes. */
export function mergeRows(products: readonly Product[], rows: readonly SkuRow[]) {
  const next = [...products];
  let added = 0, updated = 0;
  for (const r of rows) {
    const i = next.findIndex((p) => p.sku.toLowerCase() === r.sku.toLowerCase());
    if (i >= 0) {
      // blank description / logo columns keep what is already there
      next[i] = { ...next[i], name: r.name, size: r.size ?? next[i].size, category: r.category, channel: r.channel, price: r.price, was: r.was, stock: r.stock, blurb: r.blurb || next[i].blurb, image: r.image ?? next[i].image };
      updated++;
    } else {
      let id = slug(r.sku), n = 2;
      while (next.some((p) => p.id === id)) id = `${slug(r.sku)}-${n++}`;
      next.push({ id, sku: r.sku, name: r.name, size: r.size, category: r.category, channel: r.channel, price: r.price, was: r.was, stock: r.stock, blurb: r.blurb, image: r.image });
      added++;
    }
  }
  return { products: next, added, updated };
}
