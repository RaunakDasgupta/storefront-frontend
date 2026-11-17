// The mock backend: the shared slices live in this browser's localStorage.
// shortcut: replace with your catalog and orders APIs (RTK Query or thunks) before going live.
import type { Store } from "@reduxjs/toolkit";
import type { SharedState } from "./shared.ts";
import { isProduct, type CatalogState } from "./catalogSlice.ts";
import { ordersReplaced, type OrdersState } from "./ordersSlice.ts";
import { SAMPLE_ORDERS, isOrder, withChannel, type Order } from "../orderlogic.ts";

const CATALOG_KEY = "everyday.catalog";
const ORDERS_KEY = "everyday.orders";

export type StoreLike<S> = Pick<Store<S>, "getState" | "subscribe" | "dispatch">;

export function readJson(storage: Storage, key: string): unknown {
  try { return JSON.parse(storage.getItem(key) ?? "null"); } catch { return null; }
}

/** `null` removes the key. Private mode can refuse the write: the data then lasts this session only. */
export function writeJson(storage: Storage, key: string, value: unknown) {
  try { value === null ? storage.removeItem(key) : storage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ }
}

export function loadCatalog(): CatalogState {
  const saved = readJson(localStorage, CATALOG_KEY);
  return { saved: Array.isArray(saved) && saved.every(isProduct) ? saved : null };
}

export function loadOrders(): OrdersState {
  const saved = readJson(localStorage, ORDERS_KEY);
  return { items: Array.isArray(saved) && saved.every(isOrder) ? (saved as Order[]).map(withChannel) : SAMPLE_ORDERS };
}

export const loadSharedState = (): SharedState => ({ catalog: loadCatalog(), orders: loadOrders() });

/** Runs `effect` whenever the selected part of the state changes. Returns the unsubscribe. */
export function watch<S, T>(store: StoreLike<S>, select: (s: S) => T, effect: (value: T) => void) {
  let last = select(store.getState());
  return store.subscribe(() => {
    const next = select(store.getState());
    if (next === last) return;
    last = next;
    effect(next);
  });
}

/** Saves the catalog and orders on every change, and picks up orders placed or changed in another tab. Returns the cleanup. */
export function persistShared(store: StoreLike<SharedState>) {
  const stops = [
    watch(store, (s) => s.catalog.saved, (saved) => writeJson(localStorage, CATALOG_KEY, saved)),
    watch(store, (s) => s.orders.items, (items) => writeJson(localStorage, ORDERS_KEY, items)),
  ];
  const onStorage = (e: StorageEvent) => { if (e.key === ORDERS_KEY) store.dispatch(ordersReplaced(loadOrders().items)); };
  window.addEventListener("storage", onStorage);
  return () => { stops.forEach((stop) => stop()); window.removeEventListener("storage", onStorage); };
}
