// shortcut: one hard-coded staff account with a plaintext password. Staff are provisioned, not self-serve;
// replace with your staff auth API (POST /api/staff/login) or company SSO before going live.
import type { User } from "./authSlice.ts";

export const DEMO_STAFF: User & { password: string; employeeId: string } = { name: "Sam Rivera", email: "staff@storefront.test", employeeId: "EMP-1001", password: "staff1234" };

export function signInStaff(identity: string, password: string): User {
  const id = identity.trim().toLowerCase();
  const ok = (id === DEMO_STAFF.email || id === DEMO_STAFF.employeeId.toLowerCase()) && password === DEMO_STAFF.password;
  if (!ok) throw new Error("The email, employee ID or password is incorrect.");
  return { name: DEMO_STAFF.name, email: DEMO_STAFF.email };
}
