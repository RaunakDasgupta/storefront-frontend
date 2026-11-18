/** The message to show for anything a thunk threw. */
export const messageOf = (e: unknown) => (e instanceof Error && e.message ? e.message : "Something went wrong.");

/** Turns a rejected thunk's message back into an Error, for `await dispatch(thunk()).unwrap().catch(asError)`. */
export const asError = (message: unknown): never => {
  throw new Error(typeof message === "string" ? message : "Something went wrong.");
};
