// The staff portal. Shares only data (catalog) and UI primitives with the customer app.
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { Link, Route, Routes } from "react-router-dom";
import { RequireStaff } from "./components/RequireStaff";
import { StaffLayout } from "./components/Layout";
import { StaffLogin } from "./pages/Login";
import { ImportPage } from "./pages/Import";
import { StaffOrders } from "./pages/Orders";
import { Overview } from "./pages/Overview";
import { StaffProducts } from "./pages/Products";
import { makeStaffStore, persistStaff } from "./store/store";
import "./staff.css";

function StaffNotFound() {
  return (
    <div className="empty">
      <h1>Page not found</h1>
      <Link to="/staff" className="btn primary inline">Back to overview</Link>
    </div>
  );
}

export default function StaffApp() {
  // this app's own store: the customer storefront has another one
  const [store] = useState(makeStaffStore);
  useEffect(() => persistStaff(store), [store]);

  return (
    <div className="sx">
      <Provider store={store}>
        <Routes>
          <Route path="login" element={<StaffLogin />} />
          <Route element={<RequireStaff><StaffLayout /></RequireStaff>}>
            <Route index element={<Overview />} />
            <Route path="orders" element={<StaffOrders />} />
            <Route path="products" element={<StaffProducts />} />
            <Route path="import" element={<ImportPage />} />
            <Route path="*" element={<StaffNotFound />} />
          </Route>
        </Routes>
      </Provider>
    </div>
  );
}
