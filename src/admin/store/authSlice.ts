// Admin sign-in. Completely separate from the customer session: its own store, storage key and API.
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Session, ThunkExtra, User } from "../../shared/api/types.ts";
import { messageOf } from "../../shared/store/errors.ts";

export type { User };
export type AuthState = { user: User | null; token: string | null };

/** Rejects with the message to show under the form. */
export const signIn = createAsyncThunk<Session, { identity: string; password: string }, { extra: ThunkExtra; rejectValue: string }>(
  "adminAuth/signIn",
  async (credentials, { extra, rejectWithValue }) => {
    try { return await extra.api.adminAuth.signIn(credentials); } catch (e) { return rejectWithValue(messageOf(e)); }
  },
);

const slice = createSlice({
  name: "adminAuth",
  initialState: { user: null, token: null } as AuthState,
  reducers: {
    signedOut(state) { state.user = null; state.token = null; },
  },
  extraReducers: (builder) => {
    builder.addCase(signIn.fulfilled, (state, a) => { state.user = a.payload.user; state.token = a.payload.token ?? null; });
  },
});

export const { signedOut } = slice.actions;
export const authReducer = slice.reducer;
export const selectUser = (s: { auth: AuthState }) => s.auth.user;
