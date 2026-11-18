import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Address } from "../../shared/lib/orderlogic.ts";

export type CheckoutStage = "closed" | "address" | "payment" | "placed";
/** What the "order placed" popup shows. */
export type Receipt = { orderIds: string[]; paymentRef: string; paid: number };
/** Card details are deliberately not here: they live only in the payment form and are never stored. */
export type CheckoutState = { stage: CheckoutStage; address: Address | null; receipt: Receipt | null };

const slice = createSlice({
  name: "checkout",
  initialState: { stage: "closed", address: null, receipt: null } as CheckoutState,
  reducers: {
    checkoutOpened(state) { state.stage = "address"; state.receipt = null; },
    addressSaved(state, a: PayloadAction<Address>) { state.address = a.payload; state.stage = "payment"; },
    addressEditing(state) { state.stage = "address"; },
    orderPlaced(state, a: PayloadAction<Receipt>) { state.stage = "placed"; state.receipt = a.payload; },
    checkoutClosed(state) { state.stage = "closed"; state.receipt = null; },
  },
});

export const { checkoutOpened, addressSaved, addressEditing, orderPlaced, checkoutClosed } = slice.actions;
export const checkoutReducer = slice.reducer;
