// The signed-in customer as the components use it.
import { useMemo } from "react";
import { asError } from "../../shared/store/errors";
import { useAppDispatch, useAppSelector } from "../store/typedHooks";
import { selectUser, signIn, signUp, signedOut } from "../store/authSlice";

export { DEMO_CUSTOMER } from "../../shared/api/mockAccounts";
export type { User } from "../store/authSlice";

export function useCustomer() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  return useMemo(() => ({
    user,
    /** Resolves with the signed-in user, or rejects with a message to show. */
    signIn: (email: string, password: string) => dispatch(signIn({ email, password })).unwrap().then((s) => s.user, asError),
    /** Creates the account, signs the customer in and resolves with them. */
    signUp: (name: string, email: string, password: string) => dispatch(signUp({ name, email, password })).unwrap().then((s) => s.user, asError),
    signOut: () => { dispatch(signedOut()); },
  }), [dispatch, user]);
}
