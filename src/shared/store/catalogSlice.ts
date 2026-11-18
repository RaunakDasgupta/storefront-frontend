import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SkuRow } from "../lib/csv.ts";
import { seedProducts, type Product } from "../lib/data.ts";
import { isSafeImage, type ProductEdit } from "../lib/productform.ts";
import type { SharedThunk } from "./shared.ts";

/** `saved` is null until staff change the catalog; shoppers then see the built-in products. */
export type CatalogState = { saved: Product[] | null };
type Root = { catalog: CatalogState };

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "sku";

/** Guards what comes back from localStorage, which anything on this origin could have edited. */
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

const current = (state: CatalogState): readonly Product[] => state.saved ?? seedProducts;

const slice = createSlice({
  name: "catalog",
  initialState: { saved: null } as CatalogState,
  reducers: {
    /** Staff edit one product's details (the SKU stays fixed). */
    productUpdated(state, a: PayloadAction<{ id: string; edit: ProductEdit }>) {
      state.saved = current(state).map((p) => (p.id === a.payload.id ? { ...p, ...a.payload.edit } : p));
    },
    /** Existing orders keep their items. */
    productRemoved(state, a: PayloadAction<string>) {
      state.saved = current(state).filter((p) => p.id !== a.payload);
    },
    /** Puts a deleted product back where it was. */
    productRestored(state, a: PayloadAction<{ product: Product; index: number }>) {
      const { product, index } = a.payload;
      if (current(state).some((p) => p.id === product.id)) return;
      const next = [...current(state)];
      next.splice(Math.min(index, next.length), 0, product);
      state.saved = next;
    },
    skusImported(state, a: PayloadAction<SkuRow[]>) {
      state.saved = mergeRows(current(state), a.payload).products;
    },
    catalogReset(state) {
      state.saved = null;
    },
  },
});

export const { productUpdated, productRemoved, productRestored, skusImported, catalogReset } = slice.actions;
export const catalogReducer = slice.reducer;

export const selectProducts = (s: Root): readonly Product[] => current(s.catalog);
export const selectCustomized = (s: Root) => s.catalog.saved !== null;
export const selectCategories = createSelector([selectProducts], (products) => [...new Set(products.map((p) => p.category))]);

/** Deletes a product and returns it with its position, so the delete can be undone. */
export const removeProduct = (id: string): SharedThunk<{ product: Product; index: number } | undefined> => (dispatch, getState) => {
  const products = selectProducts(getState());
  const index = products.findIndex((p) => p.id === id);
  if (index < 0) return undefined;
  dispatch(productRemoved(id));
  return { product: products[index], index };
};

/** Imports CSV rows and says how many SKUs were added and updated. */
export const importSkus = (rows: SkuRow[]): SharedThunk<{ added: number; updated: number }> => (dispatch, getState) => {
  const { added, updated } = mergeRows(selectProducts(getState()), rows);
  dispatch(skusImported(rows));
  return { added, updated };
};
