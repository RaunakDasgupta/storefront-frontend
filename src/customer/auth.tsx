// Customer sign-in. Completely separate from the staff session: different storage keys, accounts and guard.
import { createContext, useContext, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export type User = { name: string; email: string };
type Account = User & { password: string };
type Auth = {
  user: User | null;
  /** Resolves with the signed-in user, or rejects with a message to show. */
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
};

// shortcut: mock accounts with plaintext passwords (the demo one plus sign-ups kept in localStorage).
// Replace with your customer auth API (POST /api/auth/login and /api/auth/register) before going live.
export const DEMO_CUSTOMER: Account = { name: "Alex Morgan", email: "customer@storefront.test", password: "customer123" };

const SESSION_KEY = "storefront.customer.session";
const ACCOUNTS_KEY = "storefront.customer.accounts";
const Ctx = createContext<Auth | null>(null);

function stored(): Account[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]"); } catch { return []; }
}
const all = () => [DEMO_CUSTOMER, ...stored()];

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null"); } catch { return null; }
  });

  const save = (u: User | null) => {
    setUser(u);
    try { u ? sessionStorage.setItem(SESSION_KEY, JSON.stringify(u)) : sessionStorage.removeItem(SESSION_KEY); } catch { /* private mode */ }
  };

  const signIn: Auth["signIn"] = async (email, password) => {
    const e = email.trim().toLowerCase();
    const match = all().find((a) => a.email.toLowerCase() === e && a.password === password);
    if (!match) throw new Error("The email or password is incorrect.");
    const u = { name: match.name, email: match.email };
    save(u);
    return u;
  };

  const signUp: Auth["signUp"] = async (name, email, password) => {
    const e = email.trim().toLowerCase();
    if (all().some((a) => a.email.toLowerCase() === e)) throw new Error("An account with this email already exists.");
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...stored(), { name, email: e, password }]));
    } catch { /* private mode: the account only lasts this session */ }
    save({ name, email: e });
  };

  return <Ctx.Provider value={{ user, signIn, signUp, signOut: () => save(null) }}>{children}</Ctx.Provider>;
}

export function useCustomer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCustomer must be used inside <CustomerAuthProvider>");
  return ctx;
}

/** Sends signed-out visitors to the customer log in page and back afterwards. */
export function RequireCustomer({ children }: { children: ReactNode }) {
  const { user } = useCustomer();
  const location = useLocation();
  return user ? children : <Navigate to="/login" state={{ from: location.pathname }} replace />;
}
