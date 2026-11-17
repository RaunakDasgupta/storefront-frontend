import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { loadSharedState, persistShared, readJson, watch, writeJson } from "../shared/store/persistence.ts";
import { sharedReducers } from "../shared/store/shared.ts";
import { authDialogReducer } from "./authDialogSlice.ts";
import { authReducer, type User } from "./authSlice.ts";
import { cartReducer } from "./cartSlice.ts";
import { toastReducer } from "./toastSlice.ts";

export const customerReducer = combineReducers({
  ...sharedReducers,
  auth: authReducer,
  cart: cartReducer,
  toast: toastReducer,
  authDialog: authDialogReducer,
});

export type CustomerState = ReturnType<typeof customerReducer>;

// The signed-in customer lasts for the browser tab (sessionStorage), separate from the staff session.
const SESSION_KEY = "storefront.customer.session";

function readSession(): User | null {
  const u = readJson(sessionStorage, SESSION_KEY) as User | null;
  return u && typeof u.name === "string" && typeof u.email === "string" ? { name: u.name, email: u.email } : null;
}

/** Tests pass their own starting state; the app starts from what the browser has saved. */
export function makeCustomerStore(preloadedState: Partial<CustomerState> = { ...loadSharedState(), auth: { user: readSession() } }) {
  return configureStore({ reducer: customerReducer, preloadedState });
}

export type CustomerStore = ReturnType<typeof makeCustomerStore>;
export type CustomerDispatch = CustomerStore["dispatch"];

/** Saves the catalog, orders and session as they change. Returns the cleanup. */
export function persistCustomer(store: CustomerStore) {
  const stopSession = watch(store, (s) => s.auth.user, (user) => writeJson(sessionStorage, SESSION_KEY, user));
  const stopShared = persistShared(store);
  return () => { stopSession(); stopShared(); };
}
