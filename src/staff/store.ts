import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { loadSharedState, persistShared, readJson, watch, writeJson } from "../shared/store/persistence.ts";
import { sharedReducers } from "../shared/store/shared.ts";
import { authReducer, type User } from "./authSlice.ts";

export const staffReducer = combineReducers({ ...sharedReducers, auth: authReducer });
export type StaffState = ReturnType<typeof staffReducer>;

// The signed-in staff member lasts for the browser tab (sessionStorage), separate from the customer session.
const SESSION_KEY = "storefront.staff.session";

function readSession(): User | null {
  const u = readJson(sessionStorage, SESSION_KEY) as User | null;
  return u && typeof u.name === "string" && typeof u.email === "string" ? { name: u.name, email: u.email } : null;
}

/** Tests pass their own starting state; the app starts from what the browser has saved. */
export function makeStaffStore(preloadedState: Partial<StaffState> = { ...loadSharedState(), auth: { user: readSession() } }) {
  return configureStore({ reducer: staffReducer, preloadedState });
}

export type StaffStore = ReturnType<typeof makeStaffStore>;
export type StaffDispatch = StaffStore["dispatch"];

/** Saves the catalog, orders and session as they change. Returns the cleanup. */
export function persistStaff(store: StaffStore) {
  const stopSession = watch(store, (s) => s.auth.user, (user) => writeJson(sessionStorage, SESSION_KEY, user));
  const stopShared = persistShared(store);
  return () => { stopSession(); stopShared(); };
}
