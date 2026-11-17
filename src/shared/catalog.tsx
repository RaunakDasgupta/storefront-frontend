import { createContext, useContext, useState, type ReactNode } from "react";
import type { SkuRow } from "./csv";
import { seedProducts, type Product } from "./data";

type Catalog = {
  products: Product[];
  categories: string[];
  byId: (id: string) => Product | undefined;
  /** True once a CSV has changed the catalog. */
  customized: boolean;
  /** Adds new SKUs and updates existing ones (matched by SKU). Never deletes. */
  importRows: (rows: SkuRow[]) => { added: number; updated: number };
  reset: () => void;
};

// shortcut: the catalog lives in this browser's localStorage; replace with your catalog API.
const KEY = "everyday.catalog";
const Ctx = createContext<Catalog | null>(null);

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "sku";

/** An http(s) link, or a file bundled under /products/. Nothing else (no javascript:, data: or other schemes). */
function isSafeImage(v: unknown) {
  if (typeof v !== "string") return false;
  if (/^\/products\/[\w.-]+$/.test(v)) return true;
  try { return /^https?:$/.test(new URL(v).protocol); } catch { return false; }
}

/** Guards what comes back from localStorage, which anything on this origin could have edited. */
function isProduct(p: unknown): p is Product {
  const x = p as Product;
  return !!x && typeof x.id === "string" && typeof x.sku === "string" && typeof x.name === "string" &&
    Number.isFinite(x.price) && Number.isFinite(x.stock) && typeof x.category === "string" && typeof x.blurb === "string" &&
    (x.image === undefined || isSafeImage(x.image)) && (x.channel === "retail" || x.channel === "bulk") && (x.size === undefined || typeof x.size === "string") && (x.was === undefined || Number.isFinite(x.was));
}

function load(): Product[] | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return Array.isArray(saved) && saved.length > 0 && saved.every(isProduct) ? saved : null;
  } catch { return null; }
}

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Product[] | null>(load);
  const products = saved ?? seedProducts;

  const commit = (next: Product[] | null) => {
    setSaved(next);
    try { next ? localStorage.setItem(KEY, JSON.stringify(next)) : localStorage.removeItem(KEY); } catch { /* private mode: lasts this session */ }
  };

  const importRows: Catalog["importRows"] = (rows) => {
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
    commit(next);
    return { added, updated };
  };

  const value: Catalog = {
    products,
    categories: [...new Set(products.map((p) => p.category))],
    byId: (id) => products.find((p) => p.id === id),
    customized: saved !== null,
    importRows,
    reset: () => commit(null),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}
