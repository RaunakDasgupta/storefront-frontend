import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { SharedState } from "./shared.ts";

// Typed against the shared slices only, so the same hooks work inside the customer and the admin store.
export const useSharedDispatch = useDispatch.withTypes<ThunkDispatch<SharedState, undefined, UnknownAction>>();
export const useSharedSelector = useSelector.withTypes<SharedState>();
