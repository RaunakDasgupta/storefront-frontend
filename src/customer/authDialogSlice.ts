import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AuthMode = "login" | "signup";
/** What happens once the shopper is logged in. Kept as plain data, since Redux state must be serializable. */
export type AfterLogin = { kind: "checkout" } | { kind: "navigate"; to: string };
export type DialogRequest = { mode: AuthMode; /** What the person is trying to do, for example "place your order". */ reason?: string; after?: AfterLogin };
export type AuthDialogState = { request: DialogRequest | null };

const slice = createSlice({
  name: "authDialog",
  initialState: { request: null } as AuthDialogState,
  reducers: {
    dialogOpened(state, a: PayloadAction<DialogRequest>) { state.request = a.payload; },
    dialogModeChanged(state, a: PayloadAction<AuthMode>) { if (state.request) state.request.mode = a.payload; },
    dialogClosed(state) { state.request = null; },
  },
});

export const { dialogOpened, dialogModeChanged, dialogClosed } = slice.actions;
export const authDialogReducer = slice.reducer;
