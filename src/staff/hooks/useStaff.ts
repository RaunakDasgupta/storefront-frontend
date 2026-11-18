// The signed-in staff member as the components use it.
import { useMemo } from "react";
import { asError } from "../../shared/store/shared";
import { useAppDispatch, useAppSelector } from "../store/typedHooks";
import { selectUser, signIn, signedOut } from "../store/authSlice";

export { DEMO_STAFF } from "../store/accounts";

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
