// The mock customer accounts. Passwords are kept out of the Redux state on purpose: only the signed-in user goes there.
// shortcut: plaintext passwords in localStorage. Replace with your customer auth API (POST /api/auth/login and /api/auth/register) before going live.
import type { User } from "./authSlice.ts";
import { readJson, writeJson } from "../../shared/store/persistence.ts";

type Account = User & { password: string };

export const DEMO_CUSTOMER: Account = { name: "Alex Morgan", email: "customer@storefront.test", password: "customer123" };

const ACCOUNTS_KEY = "storefront.customer.accounts";

function stored(): Account[] {
  const saved = readJson(localStorage, ACCOUNTS_KEY);
  return Array.isArray(saved) ? saved : [];
}
const all = () => [DEMO_CUSTOMER, ...stored()];

export function signInAccount(email: string, password: string): User {
  const e = email.trim().toLowerCase();
  const match = all().find((a) => a.email.toLowerCase() === e && a.password === password);
  if (!match) throw new Error("The email or password is incorrect.");
  return { name: match.name, email: match.email };
}

export function registerAccount(name: string, email: string, password: string): User {
  const e = email.trim().toLowerCase();
  if (all().some((a) => a.email.toLowerCase() === e)) throw new Error("An account with this email already exists.");
  writeJson(localStorage, ACCOUNTS_KEY, [...stored(), { name, email: e, password }]);
  return { name, email: e };
}
