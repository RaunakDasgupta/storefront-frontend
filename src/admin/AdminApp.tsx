// The admin portal. Shares only data (catalog) and UI primitives with the customer app.
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { Link, Route, Routes } from "react-router-dom";
import { RequireAdmin } from "./components/RequireAdmin";
import { AdminLayout } from "./components/Layout";
import { AdminLogin } from "./pages/Login";
import { ImportPage } from "./pages/Import";
import { AdminOrders } from "./pages/Orders";
import { Overview } from "./pages/Overview";
import { AdminProducts } from "./pages/Products";
import { bootAdminStore, persistAdmin } from "./store/store";

function AdminNotFound() {
  return (
    <div className="pt-12 text-center">
      <h1 className="text-[30px] leading-[1.15] font-[750] max-sm:text-[26px]">Page not found</h1>
      <Link to="/admin" className="btn btn-primary btn-inline mt-4">Back to overview</Link>
    </div>
  );
}

export default function AdminApp() {
  // this app's own store: the customer storefront has another one
  const [store] = useState(() => bootAdminStore({ env: import.meta.env }));
  useEffect(() => persistAdmin(store), [store]);

  return (
    <div className="min-h-screen bg-page">
      <Provider store={store}>
        <Routes>
          <Route path="login" element={<AdminLogin />} />
          <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<Overview />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="*" element={<AdminNotFound />} />
          </Route>
        </Routes>
      </Provider>
    </div>
  );
}
