import type { ThunkAction, UnknownAction } from "@reduxjs/toolkit";
import type { ThunkExtra } from "../../shared/api/types.ts";
import type { SkuRow } from "../../shared/lib/csv.ts";
import type { AdminState } from "./store.ts";

/** Asks the import API to read SKU rows from a database or cloud source. Rejects with the API's error. */
export const connectSource = (connector: string, service: string, settings: Record<string, string>): ThunkAction<Promise<SkuRow[]>, AdminState, ThunkExtra, UnknownAction> =>
  (_dispatch, _getState, { api }) => api.importer.connect({ connector, service, settings });
