// Staff sign-in. Completely separate from the customer session: its own store, storage key and accounts.
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { signInStaff } from "./accounts.ts";

export type User = { name: string; email: string };
export type AuthState = { user: User | null };

/** Rejects with the message to show under the form. */
export const signIn = createAsyncThunk<User, { identity: string; password: string }, { rejectValue: string }>(
  "staffAuth/signIn",
  async ({ identity, password }, { rejectWithValue }) => {
    try { return signInStaff(identity, password); } catch (e) { return rejectWithValue(e instanceof Error ? e.message : "Something went wrong."); }
  },
);

const slice = createSlice({
  name: "staffAuth",
  initialState: { user: null } as AuthState,
  reducers: {
    signedOut(state) { state.user = null; },
  },
  extraReducers: (builder) => {
    builder.addCase(signIn.fulfilled, (state, a) => { state.user = a.payload; });
  },
});

export const { signedOut } = slice.actions;
export const authReducer = slice.reducer;
export const selectUser = (s: { auth: AuthState }) => s.auth.user;
