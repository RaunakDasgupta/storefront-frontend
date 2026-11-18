import { createSlice } from "@reduxjs/toolkit";
import type { Sources } from "../api/types.ts";

/** Facts about the data layer the screens may show or adapt to, for example "this runs on sample data". Never changes. */
export type MetaState = { sources: Sources };

const slice = createSlice({
  name: "meta",
  // the real value is preloaded by each app's store factory
  initialState: { sources: { products: "mock", orders: "mock", customerAuth: "mock", adminAuth: "mock", payments: "mock", importer: "mock" } } as MetaState,
  reducers: {},
});

export const metaReducer = slice.reducer;
/** True when any resource still uses the built-in sample data. */
export const selectUsesSampleData = (s: { meta: MetaState }) => Object.values(s.meta.sources).includes("mock");
export const selectSources = (s: { meta: MetaState }) => s.meta.sources;
