// The signed-in customer as the components use it.
import { useMemo } from "react";
import { asError } from "../shared/store/shared";
import { useAppDispatch, useAppSelector } from "./hooks";
import { selectUser, signIn, signUp, signedOut } from "./authSlice";

export { DEMO_CUSTOMER } from "./accounts";
export type { User } from "./authSlice";

export function useCustomer() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);

  return useMemo(() => ({
    user,
    /** Resolves with the signed-in user, or rejects with a message to show. */
    signIn: (email: string, password: string) => dispatch(signIn({ email, password })).unwrap().catch(asError),
    /** Creates the account, signs the customer in and resolves with them. */
    signUp: (name: string, email: string, password: string) => dispatch(signUp({ name, email, password })).unwrap().catch(asError),
    signOut: () => { dispatch(signedOut()); },
  }), [dispatch, user]);
}
