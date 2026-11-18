// shortcut: one hard-coded admin account with a plaintext password. Admins are provisioned, not self-serve;
// replace with your admin auth API (POST /api/admin/login) or company SSO before going live.
import type { User } from "./authSlice.ts";

export const DEMO_ADMIN: User & { password: string; employeeId: string } = { name: "Sam Rivera", email: "admin@storefront.test", employeeId: "EMP-1001", password: "admin1234" };

export function signInAdmin(identity: string, password: string): User {
  const id = identity.trim().toLowerCase();
  const ok = (id === DEMO_ADMIN.email || id === DEMO_ADMIN.employeeId.toLowerCase()) && password === DEMO_ADMIN.password;
  if (!ok) throw new Error("The email, employee ID or password is incorrect.");
  return { name: DEMO_ADMIN.name, email: DEMO_ADMIN.email };
}
