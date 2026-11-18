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
import { makeAdminStore, persistAdmin } from "./store/store";
import "./admin.css";

function AdminNotFound() {
  return (
    <div className="empty">
      <h1>Page not found</h1>
      <Link to="/admin" className="btn primary inline">Back to overview</Link>
    </div>
  );
}

export default function AdminApp() {
  // this app's own store: the customer storefront has another one
  const [store] = useState(makeAdminStore);
  useEffect(() => persistAdmin(store), [store]);

  return (
    <div className="ax">
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
