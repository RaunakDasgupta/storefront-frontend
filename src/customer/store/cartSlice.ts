import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { selectProducts, type CatalogState } from "../../shared/store/catalogSlice.ts";

export type CartLine = { id: string; qty: number };
export type CartState = { lines: CartLine[] };
type Root = { cart: CartState; catalog: CatalogState };

const slice = createSlice({
  name: "cart",
  initialState: { lines: [] } as CartState,
  reducers: {
    itemAdded(state, a: PayloadAction<{ id: string; qty: number }>) {
      const line = state.lines.find((l) => l.id === a.payload.id);
      if (line) line.qty += a.payload.qty;
      else state.lines.push(a.payload);
    },
    /** A quantity of 0 or less removes the line. */
    qtySet(state, a: PayloadAction<{ id: string; qty: number }>) {
      const { id, qty } = a.payload;
      state.lines = qty <= 0 ? state.lines.filter((l) => l.id !== id) : state.lines.map((l) => (l.id === id ? { ...l, qty } : l));
    },
    cartCleared(state) { state.lines = []; },
  },
});

export const { itemAdded, qtySet, cartCleared } = slice.actions;
export const cartReducer = slice.reducer;

export const selectCartLines = (s: Root) => s.cart.lines;
export const selectCartCount = (s: Root) => s.cart.lines.reduce((n, l) => n + l.qty, 0);
/** The cart lines that still have a product in the catalog. */
export const selectCartItems = createSelector([selectCartLines, selectProducts], (lines, products) =>
  lines.flatMap((l) => { const p = products.find((x) => x.id === l.id); return p ? [{ p, qty: l.qty }] : []; }));
export const selectCartTotal = createSelector([selectCartItems], (items) => items.reduce((n, { p, qty }) => n + p.price * qty, 0));
