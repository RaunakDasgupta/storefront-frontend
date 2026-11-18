// The orders as the components use them: Redux state read through selectors, changes sent to the API through thunks.
import { useCallback, useEffect, useMemo } from "react";
import type { Order } from "../lib/orderlogic";
import { useSharedDispatch, useSharedSelector } from "../store/typedHooks";
import { loadOrders, removeOrder, restoreOrder, selectOrders, selectOrdersError, selectOrdersStatus, setOrderStep } from "../store/ordersSlice";

export function useOrders() {
  const dispatch = useSharedDispatch();
  const orders = useSharedSelector(selectOrders);
  const status = useSharedSelector(selectOrdersStatus);
  const error = useSharedSelector(selectOrdersError);
  // stable on purpose: effects that load on mount depend on it, and must not run again when the data arrives
  const reload = useCallback(() => { void dispatch(loadOrders()); }, [dispatch]);

  return useMemo(() => ({
    orders,
    /** "idle" and "loading" until the first load finishes, then "ready", or "failed" with `error` to show. */
    status,
    error,
    reload,
    // The changes below go to the API first and reject with its message if it refuses.
    /** Admins delete an order. Returns it with its position so the delete can be undone; the customer's My orders loses it too. */
    remove: (id: string) => dispatch(removeOrder(id)),
    restore: (order: Order, index: number) => dispatch(restoreOrder(order, index)),
    /** Admins move an order to a new fulfilment step. */
    setStep: (id: string, step: number) => dispatch(setOrderStep(id, step)),
  }), [dispatch, reload, orders, status, error]);
}

/**
 * Loads the orders when the component mounts and again whenever the tab regains focus or another tab changes
 * the browser's storage, so a status change made elsewhere shows up without a reload.
 */
export function useLoadOrders() {
  const orders = useOrders();
  const { reload } = orders;
  useEffect(() => {
    reload();
    window.addEventListener("focus", reload);
    window.addEventListener("storage", reload);
    return () => { window.removeEventListener("focus", reload); window.removeEventListener("storage", reload); };
  }, [reload]);
  return orders;
}
