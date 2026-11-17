import { createContext, useContext, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

export type Role = "customer" | "employee";
type User = { role: Role; name: string };
type Auth = {
  user: User | null;
  signIn: (role: Role, identity: string, password: string) => Promise<void>;
  signOut: () => void;
};

const KEY = "storefront.user";
const Ctx = createContext<Auth | null>(null);

export const homeFor = (role: Role) => (role === "employee" ? "/staff" : "/");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(KEY) ?? "null"); } catch { return null; }
  });

  const save = (u: User | null) => {
    setUser(u);
    try { u ? sessionStorage.setItem(KEY, JSON.stringify(u)) : sessionStorage.removeItem(KEY); } catch { /* private mode */ }
  };

  const signIn: Auth["signIn"] = async (role, identity, password) => {
    // shortcut: mock auth that accepts any non-empty credentials and keeps the user in sessionStorage;
    // replace with a fetch to the auth API (e.g. POST /api/auth/<role>/login) before going live.
    if (!identity || !password) throw new Error("Enter your credentials.");
    save({ role, name: identity.split("@")[0] });
  };

  return <Ctx.Provider value={{ user, signIn, signOut: () => save(null) }}>{children}</Ctx.Provider>;
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
