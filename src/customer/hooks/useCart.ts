import { useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../store/typedHooks";
import { cartCleared, itemAdded, qtySet, selectCartCount, selectCartItems, selectCartLines, selectCartTotal } from "../store/cartSlice";

export function useCart() {
  const dispatch = useAppDispatch();
  const lines = useAppSelector(selectCartLines);
  const items = useAppSelector(selectCartItems);
  const count = useAppSelector(selectCartCount);
  const total = useAppSelector(selectCartTotal);

  return useMemo(() => ({
    lines,
    /** The lines that still have a product, with the product attached. */
    items,
    count,
    total,
    add: (id: string, qty = 1) => { dispatch(itemAdded({ id, qty })); },
    /** A quantity of 0 or less removes the line. */
    setQty: (id: string, qty: number) => { dispatch(qtySet({ id, qty })); },
    clear: () => { dispatch(cartCleared()); },
  }), [dispatch, lines, items, count, total]);
}
