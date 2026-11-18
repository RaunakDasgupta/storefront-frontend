// The orders as the components use them: Redux state read through selectors, changes sent as actions.
import { useMemo } from "react";
import type { Channel } from "../lib/data";
import type { Order, OrderItem } from "../lib/orderlogic";
import { useSharedDispatch, useSharedSelector } from "../store/typedHooks";
import { orderRestored, orderStepSet, placeOrders, removeOrder, selectOrders } from "../store/ordersSlice";

export function useOrders() {
  const dispatch = useSharedDispatch();
  const orders = useSharedSelector(selectOrders);

  return useMemo(() => ({
    orders,
    /** Adds one new order (at "Confirmed", newest first) per channel that has items, and returns them. */
    place: (customer: Order["customer"], groups: { channel: Channel; items: OrderItem[] }[]) => dispatch(placeOrders(customer, groups)),
    /** Staff delete an order. Returns it with its position so the delete can be undone; the customer's My orders loses it too. */
    remove: (id: string) => dispatch(removeOrder(id)),
    restore: (order: Order, index: number) => { dispatch(orderRestored({ order, index })); },
    /** Staff move an order to a new fulfilment step; customers see it live, even in another tab. */
    setStep: (id: string, step: number) => { dispatch(orderStepSet({ id, step })); },
  }), [dispatch, orders]);
}
