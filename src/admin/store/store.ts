import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { createApi, type CreateApiOptions } from "../../shared/api/index.ts";
import { browserStorage } from "../../shared/api/kv.ts";
import type { Api } from "../../shared/api/types.ts";
import { watch } from "../../shared/store/persistence.ts";
import { readSession, writeSession } from "../../shared/store/session.ts";
import { sharedReducers } from "../../shared/store/shared.ts";
import { authReducer, signedOut } from "./authSlice.ts";

export const adminReducer = combineReducers({ ...sharedReducers, auth: authReducer });
export type AdminState = ReturnType<typeof adminReducer>;

const SESSION_KEY = "storefront.admin.session";

/** The store, wired to `api`. Tests pass a mock API and their own starting state. */
export function makeAdminStore(api: Api, preloadedState: Partial<AdminState> = {}) {
  return configureStore({
    reducer: adminReducer,
    preloadedState: { meta: { sources: api.sources }, ...preloadedState },
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: { api } } }),
  });
}

export type AdminStore = ReturnType<typeof makeAdminStore>;
export type AdminDispatch = AdminStore["dispatch"];

/** The app's store: the API comes from the environment, and the signed-in admin from this tab's session. */
export function bootAdminStore(options: Pick<CreateApiOptions, "env"> & Partial<CreateApiOptions>) {
  let store: AdminStore | undefined;
  const api = createApi({
    ...options,
    getToken: () => store?.getState().auth.token,
    onUnauthorized: () => { if (store?.getState().auth.token) store.dispatch(signedOut()); },
  });
  store = makeAdminStore(api, { auth: readSession(browserStorage("session"), SESSION_KEY) });
  return store;
}

/** Remembers who is signed in for this tab. Returns the cleanup. */
export function persistAdmin(store: AdminStore) {
  return watch(store, (s) => s.auth, (auth) => writeSession(browserStorage("session"), SESSION_KEY, auth));
}
