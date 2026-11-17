import type { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import { catalogReducer, type CatalogState } from "./catalogSlice.ts";
import { ordersReducer, type OrdersState } from "./ordersSlice.ts";

/** The slices both apps share: the product catalog and the orders. Each app adds its own on top. */
export const sharedReducers = { catalog: catalogReducer, orders: ordersReducer };

export type SharedState = { catalog: CatalogState; orders: OrdersState };
export type SharedThunk<R = void> = ThunkAction<R, SharedState, undefined, UnknownAction>;

/** Turns a rejected thunk's message back into an Error, for `await dispatch(thunk()).unwrap().catch(asError)`. */
export const asError = (message: unknown): never => {
  throw new Error(typeof message === "string" ? message : "Something went wrong.");
};
