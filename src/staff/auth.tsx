// The signed-in staff member as the components use it.
import { useMemo, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { asError } from "../shared/store/shared";
import { useAppDispatch, useAppSelector } from "./hooks";
import { selectUser, signIn, signedOut } from "./authSlice";

export { DEMO_STAFF } from "./accounts";

export function useStaff() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  return useMemo(() => ({
    user,
    /** Resolves once signed in, or rejects with a message to show. */
    signIn: async (identity: string, password: string) => { await dispatch(signIn({ identity, password })).unwrap().catch(asError); },
    signOut: () => { dispatch(signedOut()); },
  }), [dispatch, user]);
}

/** Sends signed-out visitors to the staff log in page and back afterwards. */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { user } = useStaff();
  const location = useLocation();
  return user ? children : <Navigate to="/staff/login" state={{ from: location.pathname }} replace />;
}
