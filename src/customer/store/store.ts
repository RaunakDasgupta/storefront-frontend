import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { createApi, type CreateApiOptions } from "../../shared/api/index.ts";
import type { Api } from "../../shared/api/types.ts";
import { watch } from "../../shared/store/persistence.ts";
import { readSession, writeSession } from "../../shared/store/session.ts";
import { sharedReducers } from "../../shared/store/shared.ts";
import { authDialogReducer } from "./authDialogSlice.ts";
import { authReducer, signedOut } from "./authSlice.ts";
import { cartReducer } from "./cartSlice.ts";
import { checkoutReducer } from "./checkoutSlice.ts";
import { toastReducer } from "./toastSlice.ts";

export const customerReducer = combineReducers({
  ...sharedReducers,
  auth: authReducer,
  cart: cartReducer,
  toast: toastReducer,
  authDialog: authDialogReducer,
  checkout: checkoutReducer,
});

export type CustomerState = ReturnType<typeof customerReducer>;

const SESSION_KEY = "storefront.customer.session";

/** The store, wired to `api`. Tests pass a mock API and their own starting state. */
export function makeCustomerStore(api: Api, preloadedState: Partial<CustomerState> = {}) {
  return configureStore({
    reducer: customerReducer,
    preloadedState: { meta: { sources: api.sources }, ...preloadedState },
    middleware: (getDefault) => getDefault({ thunk: { extraArgument: { api } } }),
  });
}

export type CustomerStore = ReturnType<typeof makeCustomerStore>;
export type CustomerDispatch = CustomerStore["dispatch"];

/** The app's store: the API comes from the environment, and the signed-in customer from this tab's session. */
export function bootCustomerStore(options: Pick<CreateApiOptions, "env"> & Partial<CreateApiOptions>) {
  let store: CustomerStore | undefined;
  const api = createApi({
    ...options,
    getToken: () => store?.getState().auth.token,
    // a rejected token means the session ended: sign out so the login popup comes back
    onUnauthorized: () => { if (store?.getState().auth.token) store.dispatch(signedOut()); },
  });
  store = makeCustomerStore(api, { auth: readSession(sessionStorage, SESSION_KEY) });
  return store;
}

/** Remembers who is signed in for this tab. Returns the cleanup. */
export function persistCustomer(store: CustomerStore) {
  return watch(store, (s) => s.auth, (auth) => writeSession(sessionStorage, SESSION_KEY, auth));
}
