import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin";

/** Sends signed-out visitors to the admin log in page and back afterwards. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAdmin();
  const location = useLocation();
  return user ? children : <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
}
