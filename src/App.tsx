import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

// Two independent apps, each loaded (and styled) only when its URL is visited.
const CustomerApp = lazy(() => import("./customer/CustomerApp"));
const AdminApp = lazy(() => import("./admin/AdminApp"));

/** The portal used to live at /staff: send old links to /admin. */
function OldStaffLink() {
  const { pathname, search } = useLocation();
  return <Navigate to={`/admin${pathname.slice("/staff".length)}${search}`} replace />;
}

export function App() {
  return (
    <Suspense fallback={<p className="px-4 py-14 text-center text-muted" role="status">Loading…</p>}>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/staff/*" element={<OldStaffLink />} />
        <Route path="/*" element={<CustomerApp />} />
      </Routes>
    </Suspense>
  );
}
