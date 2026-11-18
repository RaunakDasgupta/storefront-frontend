import { useDispatch, useSelector } from "react-redux";
import type { AdminDispatch, AdminState } from "./store";

export const useAppDispatch = useDispatch.withTypes<AdminDispatch>();
export const useAppSelector = useSelector.withTypes<AdminState>();
