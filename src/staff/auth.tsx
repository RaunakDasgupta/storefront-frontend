// Staff sign-in. Completely separate from the customer session: different storage key, accounts and guard.
import { createContext, useContext, useState, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

type User = { name: string; email: string };
type Account = User & { password: string; employeeId: string };
type Auth = {
  user: User | null;
  signIn: (identity: string, password: string) => Promise<void>;
  signOut: () => void;
};

// shortcut: one hard-coded staff account with a plaintext password. Staff are provisioned, not self-serve;
// replace with your staff auth API (POST /api/staff/login) or company SSO before going live.
export const DEMO_STAFF: Account = { name: "Sam Rivera", email: "staff@storefront.test", employeeId: "EMP-1001", password: "staff1234" };

const SESSION_KEY = "storefront.staff.session";
const Ctx = createContext<Auth | null>(null);

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null"); } catch { return null; }
  });

  const save = (u: User | null) => {
    setUser(u);
    try { u ? sessionStorage.setItem(SESSION_KEY, JSON.stringify(u)) : sessionStorage.removeItem(SESSION_KEY); } catch { /* private mode */ }
  };

  const signIn: Auth["signIn"] = async (identity, password) => {
    const id = identity.trim().toLowerCase();
    const ok = (id === DEMO_STAFF.email || id === DEMO_STAFF.employeeId.toLowerCase()) && password === DEMO_STAFF.password;
    if (!ok) throw new Error("The email, employee ID or password is incorrect.");
    save({ name: DEMO_STAFF.name, email: DEMO_STAFF.email });
  };

  return <Ctx.Provider value={{ user, signIn, signOut: () => save(null) }}>{children}</Ctx.Provider>;
}

export function useStaff() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStaff must be used inside <StaffAuthProvider>");
  return ctx;
}

/** Sends signed-out visitors to the staff log in page and back afterwards. */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { user } = useStaff();
  const location = useLocation();
  return user ? children : <Navigate to="/staff/login" state={{ from: location.pathname }} replace />;
}
