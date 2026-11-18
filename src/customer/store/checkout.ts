import type { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import type { Address } from "../../shared/lib/orderlogic.ts";
import { placeOrders } from "../../shared/store/ordersSlice.ts";
import type { User } from "./authSlice.ts";
import { cartCleared, selectCartItems } from "./cartSlice.ts";
import { checkoutClosed, orderPlaced } from "./checkoutSlice.ts";
import type { CustomerState } from "./store.ts";

/**
 * Runs after the payment went through: places the order(s) for this customer, empties the cart and moves the
 * checkout popup to its "order placed" step. Retail and bulk items are fulfilled separately, so they become separate orders.
 */
export const checkout = (who: User, shipping: Address, paymentRef: string): ThunkAction<void, CustomerState, undefined, UnknownAction> => (dispatch, getState) => {
  const items = selectCartItems(getState());
  const line = ({ p, qty }: (typeof items)[number]) => ({ id: p.id, name: p.name, size: p.size, qty, price: p.price });
  const made = dispatch(placeOrders({ name: who.name, email: who.email }, [
    { channel: "retail", items: items.filter(({ p }) => p.channel === "retail").map(line) },
    { channel: "bulk", items: items.filter(({ p }) => p.channel === "bulk").map(line) },
  ], shipping));
  dispatch(cartCleared());
  if (made.length === 0) { dispatch(checkoutClosed()); return; }
  dispatch(orderPlaced({ orderIds: made.map((o) => o.id), paymentRef, paid: made.reduce((sum, o) => sum + o.total, 0) }));
};
