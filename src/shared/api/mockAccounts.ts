// The mock sign-in accounts, for when no auth API is configured. Passwords never reach the Redux state.
// shortcut: plaintext passwords in localStorage, one hard-coded admin. Set VITE_API_URL (or the auth URLs) to use real auth instead.
import type { User } from "./types.ts";
import { readJson, writeJson, type KV } from "./kv.ts";

type Account = User & { password: string };

export const DEMO_CUSTOMER: Account = { name: "Alex Morgan", email: "customer@storefront.test", password: "customer123" };
export const DEMO_ADMIN: Account & { employeeId: string } = { name: "Sam Rivera", email: "admin@storefront.test", employeeId: "EMP-1001", password: "admin1234" };

const ACCOUNTS_KEY = "storefront.customer.accounts";

const stored = (kv: KV): Account[] => {
  const saved = readJson(kv, ACCOUNTS_KEY);
  return Array.isArray(saved) ? saved : [];
};
const all = (kv: KV) => [DEMO_CUSTOMER, ...stored(kv)];

export function signInCustomer(kv: KV, email: string, password: string): User {
  const e = email.trim().toLowerCase();
  const match = all(kv).find((a) => a.email.toLowerCase() === e && a.password === password);
  if (!match) throw new Error("The email or password is incorrect.");
  return { name: match.name, email: match.email };
}

export function registerCustomer(kv: KV, name: string, email: string, password: string): User {
  const e = email.trim().toLowerCase();
  if (all(kv).some((a) => a.email.toLowerCase() === e)) throw new Error("An account with this email already exists.");
  writeJson(kv, ACCOUNTS_KEY, [...stored(kv), { name, email: e, password }]);
  return { name, email: e };
}

export function signInAdmin(identity: string, password: string): User {
  const id = identity.trim().toLowerCase();
  const ok = (id === DEMO_ADMIN.email || id === DEMO_ADMIN.employeeId.toLowerCase()) && password === DEMO_ADMIN.password;
  if (!ok) throw new Error("The email, employee ID or password is incorrect.");
  return { name: DEMO_ADMIN.name, email: DEMO_ADMIN.email };
}
