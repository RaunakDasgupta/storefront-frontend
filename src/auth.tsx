import { createContext, useContext, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export type Role = "customer" | "employee";
type User = { role: Role; name: string; email?: string };
type Account = { role: Role; name: string; email: string; password: string; employeeId?: string };
type Auth = {
  user: User | null;
  signIn: (role: Role, identity: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => void;
};

// shortcut: mock accounts with plaintext passwords (demo ones below plus sign-ups kept in localStorage).
// Replace the whole store with your auth API (POST /api/auth/<role>/login and /register) before going live.
export const DEMO: Record<Role, Account> = {
  customer: { role: "customer", name: "Alex Morgan", email: "customer@storefront.test", password: "customer123" },
  employee: { role: "employee", name: "Sam Rivera", email: "staff@storefront.test", employeeId: "EMP-1001", password: "staff1234" },
};

const USER_KEY = "storefront.user";
const ACCOUNTS_KEY = "storefront.accounts";
const Ctx = createContext<Auth | null>(null);

export const homeFor = (role: Role) => (role === "employee" ? "/staff" : "/");

function storedAccounts(): Account[] {
  try { return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? "[]"); } catch { return []; }
}
const allAccounts = () => [...Object.values(DEMO), ...storedAccounts()];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(USER_KEY) ?? "null"); } catch { return null; }
  });

  const save = (u: User | null) => {
    setUser(u);
    try { u ? sessionStorage.setItem(USER_KEY, JSON.stringify(u)) : sessionStorage.removeItem(USER_KEY); } catch { /* private mode */ }
  };

  const signIn: Auth["signIn"] = async (role, identity, password) => {
    const id = identity.trim().toLowerCase();
    const match = allAccounts().find(
      (a) => a.role === role && (a.email.toLowerCase() === id || a.employeeId?.toLowerCase() === id) && a.password === password,
    );
    if (!match) throw new Error("The email or password is incorrect.");
    save({ role, name: match.name, email: match.email });
  };

  const signUp: Auth["signUp"] = async (name, email, password) => {
    const e = email.trim().toLowerCase();
    if (allAccounts().some((a) => a.email.toLowerCase() === e)) throw new Error("An account with this email already exists.");
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...storedAccounts(), { role: "customer", name, email: e, password }]));
    } catch { /* private mode: the account only lasts this session */ }
    save({ role: "customer", name, email: e });
  };

  return <Ctx.Provider value={{ user, signIn, signUp, signOut: () => save(null) }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/** Route guard: signed-out users go to /login, the wrong role goes to its own home. */
export function RequireRole({ role, children }: { role: Role; children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
