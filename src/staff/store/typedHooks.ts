import { useDispatch, useSelector } from "react-redux";
import type { StaffDispatch, StaffState } from "./store";

export const useAppDispatch = useDispatch.withTypes<StaffDispatch>();
export const useAppSelector = useSelector.withTypes<StaffState>();
