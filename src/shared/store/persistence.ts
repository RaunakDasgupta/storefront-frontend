// Small store helpers. The catalog and orders are not saved here any more: where they live is the API's business (see ../api).
import type { Store } from "@reduxjs/toolkit";

export { readJson, writeJson } from "../api/kv.ts";

export type StoreLike<S> = Pick<Store<S>, "getState" | "subscribe" | "dispatch">;

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
