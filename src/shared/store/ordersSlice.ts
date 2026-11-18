import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Channel } from "../lib/data.ts";
import { SAMPLE_ORDERS, makeOrders, withOrderAt, withStep, withoutOrder, type Address, type Order, type OrderItem } from "../lib/orderlogic.ts";
import type { SharedThunk } from "./shared.ts";

/** One orders list for both apps: customers place orders in the storefront, staff manage them in the portal. */
export type OrdersState = { items: Order[] };
type Root = { orders: OrdersState };

const slice = createSlice({
  name: "orders",
  initialState: { items: SAMPLE_ORDERS } as OrdersState,
  reducers: {
    /** Newest (highest id) first. */
    ordersPlaced(state, a: PayloadAction<Order[]>) {
      state.items = [...[...a.payload].reverse(), ...state.items];
    },
    /** Staff move an order to a new fulfilment step; customers see it straight away. */
    orderStepSet(state, a: PayloadAction<{ id: string; step: number }>) {
      state.items = withStep(state.items, a.payload.id, a.payload.step);
    },
    orderRemoved(state, a: PayloadAction<string>) {
      state.items = withoutOrder(state.items, a.payload);
    },
    /** Puts a deleted order back where it was. */
    orderRestored(state, a: PayloadAction<{ order: Order; index: number }>) {
      state.items = withOrderAt(state.items, a.payload.order, a.payload.index);
    },
    /** Another tab changed the orders: take its version. */
    ordersReplaced(state, a: PayloadAction<Order[]>) {
      state.items = a.payload;
    },
  },
});

export const { ordersPlaced, orderStepSet, orderRemoved, orderRestored, ordersReplaced } = slice.actions;
export const ordersReducer = slice.reducer;

export const selectOrders = (s: Root) => s.orders.items;

/** Adds one new order per channel that has items, and returns them. */
export const placeOrders = (customer: Order["customer"], groups: { channel: Channel; items: OrderItem[] }[], shipping?: Address): SharedThunk<Order[]> => (dispatch, getState) => {
  const made = makeOrders(selectOrders(getState()), customer, groups, undefined, shipping);
  dispatch(ordersPlaced(made));
  return made;
};

/** Deletes an order and returns it with its position, so the delete can be undone. */
export const removeOrder = (id: string): SharedThunk<{ order: Order; index: number } | undefined> => (dispatch, getState) => {
  const orders = selectOrders(getState());
  const index = orders.findIndex((o) => o.id === id);
  if (index < 0) return undefined;
  dispatch(orderRemoved(id));
  return { order: orders[index], index };
};
