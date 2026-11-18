import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useStaff } from "../hooks/useStaff";

/** Sends signed-out visitors to the staff log in page and back afterwards. */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { user } = useStaff();
  const location = useLocation();
  return user ? children : <Navigate to="/staff/login" state={{ from: location.pathname }} replace />;
}
