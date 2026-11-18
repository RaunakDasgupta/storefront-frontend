// Customer sign-in. Completely separate from the admin session: its own store, storage key and accounts.
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { registerAccount, signInAccount } from "./accounts.ts";

export type User = { name: string; email: string };
export type AuthState = { user: User | null };

const messageOf = (e: unknown) => (e instanceof Error ? e.message : "Something went wrong.");

/** Both thunks reject with the message to show under the form. */
export const signIn = createAsyncThunk<User, { email: string; password: string }, { rejectValue: string }>(
  "customerAuth/signIn",
  async ({ email, password }, { rejectWithValue }) => {
    try { return signInAccount(email, password); } catch (e) { return rejectWithValue(messageOf(e)); }
  },
);

export const signUp = createAsyncThunk<User, { name: string; email: string; password: string }, { rejectValue: string }>(
  "customerAuth/signUp",
  async ({ name, email, password }, { rejectWithValue }) => {
    try { return registerAccount(name, email, password); } catch (e) { return rejectWithValue(messageOf(e)); }
  },
);

const slice = createSlice({
  name: "customerAuth",
  initialState: { user: null } as AuthState,
  reducers: {
    signedOut(state) { state.user = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(signIn.fulfilled, (state, a) => { state.user = a.payload; })
      .addCase(signUp.fulfilled, (state, a) => { state.user = a.payload; });
  },
});

export const { signedOut } = slice.actions;
export const authReducer = slice.reducer;
export const selectUser = (s: { auth: AuthState }) => s.auth.user;
