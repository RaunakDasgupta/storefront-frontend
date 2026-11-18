// The signed-in session lasts for the browser tab (sessionStorage), one key per app so the two logins stay separate.
import type { KV } from "../api/kv.ts";
import { readJson, writeJson } from "../api/kv.ts";
import type { User } from "../api/types.ts";

export type SessionState = { user: User | null; token: string | null };
const SIGNED_OUT: SessionState = { user: null, token: null };

export function readSession(storage: KV, key: string): SessionState {
  const s = readJson(storage, key) as { user?: Partial<User>; token?: unknown } | null;
  if (typeof s?.user?.name !== "string" || typeof s.user.email !== "string") return SIGNED_OUT;
  return { user: { name: s.user.name, email: s.user.email }, token: typeof s.token === "string" ? s.token : null };
}

export const writeSession = (storage: KV, key: string, session: SessionState) => writeJson(storage, key, session.user ? session : null);
