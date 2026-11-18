import type { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import { placeOrders } from "../../shared/store/ordersSlice.ts";
import type { User } from "./authSlice.ts";
import { cartCleared, selectCartItems } from "./cartSlice.ts";
import type { CustomerState } from "./store.ts";
import { toastShown } from "./toastSlice.ts";

/**
 * Places the order(s) for this customer. Retail and bulk items are fulfilled separately, so they become separate orders.
 * The cart empties and a small popup links to the order(s).
 */
export const checkout = (who: User): ThunkAction<void, CustomerState, undefined, UnknownAction> => (dispatch, getState) => {
  const items = selectCartItems(getState());
  const line = ({ p, qty }: (typeof items)[number]) => ({ id: p.id, name: p.name, size: p.size, qty, price: p.price });
  const made = dispatch(placeOrders({ name: who.name, email: who.email }, [
    { channel: "retail", items: items.filter(({ p }) => p.channel === "retail").map(line) },
    { channel: "bulk", items: items.filter(({ p }) => p.channel === "bulk").map(line) },
  ]));
  dispatch(cartCleared());
  if (made.length === 0) return;
  dispatch(toastShown(made.length > 1
    ? { message: `Orders placed: ${made.map((o) => o.id).join(" and ")}`, actionLabel: "View orders", to: "/orders" }
    : { message: `Order ${made[0].id} placed`, actionLabel: "View order", to: "/orders" }));
};
