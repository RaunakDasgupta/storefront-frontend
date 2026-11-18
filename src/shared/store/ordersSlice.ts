import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { NewOrders, ThunkExtra } from "../api/types.ts";
import { withOrderAt, withoutOrder, type Order } from "../lib/orderlogic.ts";
import type { LoadStatus } from "./catalogSlice.ts";
import { messageOf } from "./errors.ts";
import type { SharedThunk } from "./shared.ts";

/** One orders list for both apps: customers place orders in the storefront, admins manage them in the portal. */
export type OrdersState = { items: Order[]; status: LoadStatus; error: string | null };
type Root = { orders: OrdersState };

/** Fetches the orders from the API (a customer's own, or everyone's for an admin). Rejects with the message to show. */
export const loadOrders = createAsyncThunk<Order[], void, { extra: ThunkExtra; rejectValue: string }>(
  "orders/load",
  async (_, { extra, rejectWithValue }) => {
    try { return await extra.api.orders.list(); } catch (e) { return rejectWithValue(messageOf(e)); }
  },
);

const slice = createSlice({
  name: "orders",
  initialState: { items: [], status: "idle", error: null } as OrdersState,
  reducers: {
    /** Newest (highest id) first. */
    ordersPlaced(state, a: PayloadAction<Order[]>) {
      state.items = [...[...a.payload].reverse(), ...state.items];
    },
    /** The server's version of one order after a status change. */
    orderReplaced(state, a: PayloadAction<Order>) {
      state.items = state.items.map((o) => (o.id === a.payload.id ? a.payload : o));
    },
    orderRemoved(state, a: PayloadAction<string>) {
      state.items = withoutOrder(state.items, a.payload);
    },
    /** Puts a deleted order back where it was. */
    orderRestored(state, a: PayloadAction<{ order: Order; index: number }>) {
      state.items = withOrderAt(state.items, a.payload.order, a.payload.index);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadOrders.pending, (state) => { if (state.status !== "ready") { state.status = "loading"; state.error = null; } })
      .addCase(loadOrders.fulfilled, (state, a) => { state.items = a.payload; state.status = "ready"; state.error = null; })
      // a failed refresh keeps showing what is already there
      .addCase(loadOrders.rejected, (state, a) => { if (state.status !== "ready") { state.status = "failed"; state.error = a.payload ?? "Couldn't load the orders."; } });
  },
});

export const { ordersPlaced, orderReplaced, orderRemoved, orderRestored } = slice.actions;
export const ordersReducer = slice.reducer;

export const selectOrders = (s: Root) => s.orders.items;
export const selectOrdersStatus = (s: Root) => s.orders.status;
export const selectOrdersError = (s: Root) => s.orders.error;

// Like the catalog thunks: the API first, then the store, and the API's error is thrown for the caller to show.

/** Places one order per channel that has items, and returns them. */
export const placeOrders = (input: NewOrders): SharedThunk<Promise<Order[]>> => async (dispatch, _getState, { api }) => {
  const made = await api.orders.create(input);
  dispatch(ordersPlaced(made));
  return made;
};

/** Admins move an order to a new fulfilment step; customers see it when they next load their orders. */
export const setOrderStep = (id: string, step: number): SharedThunk<Promise<void>> => async (dispatch, _getState, { api }) => {
  dispatch(orderReplaced(await api.orders.setStep(id, step)));
};

/** Deletes an order and returns it with its position, so the delete can be undone. */
export const removeOrder = (id: string): SharedThunk<Promise<{ order: Order; index: number } | undefined>> => async (dispatch, getState, { api }) => {
  const orders = selectOrders(getState());
  const index = orders.findIndex((o) => o.id === id);
  if (index < 0) return undefined;
  await api.orders.remove(id);
  dispatch(orderRemoved(id));
  return { order: orders[index], index };
};

export const restoreOrder = (order: Order, index: number): SharedThunk<Promise<void>> => async (dispatch, _getState, { api }) => {
  dispatch(orderRestored({ order: await api.orders.restore(order, index), index }));
};

