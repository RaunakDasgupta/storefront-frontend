import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export type ToastInput = { message: string; actionLabel?: string; to?: string };
export type ToastState = { current: (ToastInput & { id: string }) | null };

const slice = createSlice({
  name: "toast",
  initialState: { current: null } as ToastState,
  reducers: {
    // a new id each time, so showing the same message again restarts the popup
    toastShown: {
      reducer(state, a: PayloadAction<ToastInput & { id: string }>) { state.current = a.payload; },
      prepare: (t: ToastInput) => ({ payload: { ...t, id: nanoid() } }),
    },
    toastDismissed(state) { state.current = null; },
  },
});

export const { toastShown, toastDismissed } = slice.actions;
export const toastReducer = slice.reducer;
