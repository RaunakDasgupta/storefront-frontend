// Customer sign-in. Completely separate from the admin session: its own store, storage key and API.
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { Session, ThunkExtra, User } from "../../shared/api/types.ts";
import { messageOf } from "../../shared/store/errors.ts";

export type { User };
export type AuthState = { user: User | null; token: string | null };

/** Both thunks reject with the message to show under the form. */
export const signIn = createAsyncThunk<Session, { email: string; password: string }, { extra: ThunkExtra; rejectValue: string }>(
  "customerAuth/signIn",
  async (credentials, { extra, rejectWithValue }) => {
    try { return await extra.api.customerAuth.signIn(credentials); } catch (e) { return rejectWithValue(messageOf(e)); }
  },
);

export const signUp = createAsyncThunk<Session, { name: string; email: string; password: string }, { extra: ThunkExtra; rejectValue: string }>(
  "customerAuth/signUp",
  async (details, { extra, rejectWithValue }) => {
    try { return await extra.api.customerAuth.signUp(details); } catch (e) { return rejectWithValue(messageOf(e)); }
  },
);

const slice = createSlice({
  name: "customerAuth",
  initialState: { user: null, token: null } as AuthState,
  reducers: {
    signedOut(state) { state.user = null; state.token = null; },
  },
  extraReducers: (builder) => {
    const signedIn = (state: AuthState, a: { payload: Session }) => { state.user = a.payload.user; state.token = a.payload.token ?? null; };
    builder.addCase(signIn.fulfilled, signedIn).addCase(signUp.fulfilled, signedIn);
  },
});

export const { signedOut } = slice.actions;
export const authReducer = slice.reducer;
export const selectUser = (s: { auth: AuthState }) => s.auth.user;
