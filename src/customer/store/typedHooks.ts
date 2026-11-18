import { useDispatch, useSelector } from "react-redux";
import type { CustomerDispatch, CustomerState } from "./store";

export const useAppDispatch = useDispatch.withTypes<CustomerDispatch>();
export const useAppSelector = useSelector.withTypes<CustomerState>();
