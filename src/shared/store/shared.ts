import type { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import type { ThunkExtra } from "../api/types.ts";
import { catalogReducer, type CatalogState } from "./catalogSlice.ts";
import { metaReducer, type MetaState } from "./metaSlice.ts";
import { ordersReducer, type OrdersState } from "./ordersSlice.ts";

/** The slices both apps share: the product catalog, the orders and facts about the data layer. Each app adds its own on top. */
export const sharedReducers = { catalog: catalogReducer, orders: ordersReducer, meta: metaReducer };

export type SharedState = { catalog: CatalogState; orders: OrdersState; meta: MetaState };
/** A thunk gets the API through its third argument. */
export type SharedThunk<R = void> = ThunkAction<R, SharedState, ThunkExtra, UnknownAction>;
