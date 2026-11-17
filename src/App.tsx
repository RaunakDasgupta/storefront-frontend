import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

// Two independent apps, each loaded (and styled) only when its URL is visited.
const CustomerApp = lazy(() => import("./customer/CustomerApp"));
const StaffApp = lazy(() => import("./staff/StaffApp"));

export function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/staff/*" element={<StaffApp />} />
        <Route path="/*" element={<CustomerApp />} />
      </Routes>
    </Suspense>
  );
}
