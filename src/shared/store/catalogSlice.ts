import { createAsyncThunk, createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ThunkExtra } from "../api/types.ts";
import type { SkuRow } from "../lib/csv.ts";
import type { Product } from "../lib/data.ts";
import type { NewProduct, ProductEdit } from "../lib/productform.ts";
import { messageOf } from "./errors.ts";
import type { SharedThunk } from "./shared.ts";

/** "idle" until the first load starts. A refresh of already loaded data never goes back to "loading". */
export type LoadStatus = "idle" | "loading" | "ready" | "failed";
export type CatalogState = { items: Product[]; status: LoadStatus; error: string | null };
type Root = { catalog: CatalogState };

/** Fetches the products from the API. Rejects with the message to show. */
export const loadCatalog = createAsyncThunk<Product[], void, { extra: ThunkExtra; rejectValue: string }>(
  "catalog/load",
  async (_, { extra, rejectWithValue }) => {
    try { return await extra.api.products.list(); } catch (e) { return rejectWithValue(messageOf(e)); }
  },
);

const slice = createSlice({
  name: "catalog",
  initialState: { items: [], status: "idle", error: null } as CatalogState,
  reducers: {
    /** A product the server just created goes at the end. */
    productAdded(state, a: PayloadAction<Product>) { state.items.push(a.payload); },
    /** The server's version of one product after an edit. */
    productReplaced(state, a: PayloadAction<Product>) {
      state.items = state.items.map((p) => (p.id === a.payload.id ? a.payload : p));
    },
    /** Existing orders keep their items. */
    productRemoved(state, a: PayloadAction<string>) {
      state.items = state.items.filter((p) => p.id !== a.payload);
    },
    /** Puts a deleted product back where it was. */
    productRestored(state, a: PayloadAction<{ product: Product; index: number }>) {
      const { product, index } = a.payload;
      if (state.items.some((p) => p.id === product.id)) return;
      state.items.splice(Math.min(index, state.items.length), 0, product);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadCatalog.pending, (state) => { if (state.status !== "ready") { state.status = "loading"; state.error = null; } })
      .addCase(loadCatalog.fulfilled, (state, a) => { state.items = a.payload; state.status = "ready"; state.error = null; })
      // a failed refresh keeps showing what is already there
      .addCase(loadCatalog.rejected, (state, a) => { if (state.status !== "ready") { state.status = "failed"; state.error = a.payload ?? "Couldn't load the products."; } });
  },
});

export const { productAdded, productReplaced, productRemoved, productRestored } = slice.actions;
export const catalogReducer = slice.reducer;

export const selectProducts = (s: Root): readonly Product[] => s.catalog.items;
export const selectCatalogStatus = (s: Root) => s.catalog.status;
export const selectCatalogError = (s: Root) => s.catalog.error;
export const selectCategories = createSelector([selectProducts], (products) => [...new Set(products.map((p) => p.category))]);

// The thunks below call the API first and only then change the store, so the screen never shows a change the server refused.
// They throw the API's error for the caller to show.

/** Adds a product and returns it. Throws the API's error, for example when the SKU already exists. */
export const addProduct = (input: NewProduct): SharedThunk<Promise<Product>> => async (dispatch, _getState, { api }) => {
  const created = await api.products.create(input);
  dispatch(productAdded(created));
  return created;
};

/** Saves an edit and returns the saved product. */
export const saveProduct = (id: string, edit: ProductEdit): SharedThunk<Promise<Product>> => async (dispatch, _getState, { api }) => {
  const saved = await api.products.update(id, edit);
  dispatch(productReplaced(saved));
  return saved;
};

/** Deletes a product and returns it with its position, so the delete can be undone. */
export const removeProduct = (id: string): SharedThunk<Promise<{ product: Product; index: number } | undefined>> => async (dispatch, getState, { api }) => {
  const products = selectProducts(getState());
  const index = products.findIndex((p) => p.id === id);
  if (index < 0) return undefined;
  await api.products.remove(id);
  dispatch(productRemoved(id));
  return { product: products[index], index };
};

export const restoreProduct = (product: Product, index: number): SharedThunk<Promise<void>> => async (dispatch, _getState, { api }) => {
  dispatch(productRestored({ product: await api.products.restore(product, index), index }));
};

/** Imports rows, reloads the catalog and says how many SKUs were added and updated. */
export const importSkus = (rows: SkuRow[]): SharedThunk<Promise<{ added: number; updated: number }>> => async (dispatch, _getState, { api }) => {
  const result = await api.products.importRows(rows);
  await dispatch(loadCatalog());
  return result;
};

/** Back to the sample products. Only when the products come from the built-in sample data. */
export const resetCatalog = (): SharedThunk<Promise<void>> => async (dispatch, _getState, { api }) => {
  if (!api.products.reset) throw new Error("Resetting is only available with the sample data.");
  await api.products.reset();
  await dispatch(loadCatalog());
};
