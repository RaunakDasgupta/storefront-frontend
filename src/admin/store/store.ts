import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { loadSharedState, persistShared, readJson, watch, writeJson } from "../../shared/store/persistence.ts";
import { sharedReducers } from "../../shared/store/shared.ts";
import { authReducer, type User } from "./authSlice.ts";

export const adminReducer = combineReducers({ ...sharedReducers, auth: authReducer });
export type AdminState = ReturnType<typeof adminReducer>;

// The signed-in admin user lasts for the browser tab (sessionStorage), separate from the customer session.
const SESSION_KEY = "storefront.admin.session";

function readSession(): User | null {
  const u = readJson(sessionStorage, SESSION_KEY) as User | null;
  return u && typeof u.name === "string" && typeof u.email === "string" ? { name: u.name, email: u.email } : null;
}

/** Tests pass their own starting state; the app starts from what the browser has saved. */
export function makeAdminStore(preloadedState: Partial<AdminState> = { ...loadSharedState(), auth: { user: readSession() } }) {
  return configureStore({ reducer: adminReducer, preloadedState });
}

export type AdminStore = ReturnType<typeof makeAdminStore>;
export type AdminDispatch = AdminStore["dispatch"];

/** Saves the catalog, orders and session as they change. Returns the cleanup. */
export function persistAdmin(store: AdminStore) {
  const stopSession = watch(store, (s) => s.auth.user, (user) => writeJson(sessionStorage, SESSION_KEY, user));
  const stopShared = persistShared(store);
  return () => { stopSession(); stopShared(); };
}
