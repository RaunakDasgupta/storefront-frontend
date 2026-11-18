import type { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import type { Card, ThunkExtra } from "../../shared/api/types.ts";
import type { Address } from "../../shared/lib/orderlogic.ts";
import { messageOf } from "../../shared/store/errors.ts";
import { placeOrders } from "../../shared/store/ordersSlice.ts";
import type { User } from "./authSlice.ts";
import { cartCleared, selectCartItems, selectCartTotal } from "./cartSlice.ts";
import { checkoutClosed, orderPlaced } from "./checkoutSlice.ts";
import type { CustomerState } from "./store.ts";

/**
 * Runs after the payment went through: places the order(s) for this customer, empties the cart and moves the
 * checkout popup to its "order placed" step. Retail and bulk items are fulfilled separately, so they become separate orders.
 * Throws the API's error if the order could not be placed; the cart is kept in that case.
 */
export const checkout = (who: User, shipping: Address, paymentRef: string): ThunkAction<Promise<void>, CustomerState, ThunkExtra, UnknownAction> => async (dispatch, getState) => {
  const items = selectCartItems(getState());
  const line = ({ p, qty }: (typeof items)[number]) => ({ id: p.id, name: p.name, size: p.size, qty, price: p.price });
  const groups = [
    { channel: "retail" as const, items: items.filter(({ p }) => p.channel === "retail").map(line) },
    { channel: "bulk" as const, items: items.filter(({ p }) => p.channel === "bulk").map(line) },
  ].filter((g) => g.items.length > 0);
  if (groups.length === 0) { dispatch(checkoutClosed()); return; }

  const made = await dispatch(placeOrders({ customer: { name: who.name, email: who.email }, shipping, paymentRef, groups }));
  dispatch(cartCleared());
  dispatch(orderPlaced({ orderIds: made.map((o) => o.id), paymentRef, paid: made.reduce((sum, o) => sum + o.total, 0) }));
};

/**
 * Charges the card, then places the order. Resolves with a message to show when the payment was declined or the order
 * could not be placed, or null once the order is placed. Rejects only if the payment gateway could not be reached.
 */
export const payAndCheckout = (who: User, shipping: Address, card: Card): ThunkAction<Promise<string | null>, CustomerState, ThunkExtra, UnknownAction> => async (dispatch, getState, { api }) => {
  // the server should work out the real amount itself; this one is what the customer saw
  const payment = await api.payments.charge({ amount: selectCartTotal(getState()), card });
  if (!payment.ok) return payment.message;
  try {
    await dispatch(checkout(who, shipping, payment.ref));
    return null;
  } catch (e) {
    return `Your payment went through (reference ${payment.ref}) but the order could not be placed: ${messageOf(e)} Do not pay again; contact support with this reference.`;
  }
};
