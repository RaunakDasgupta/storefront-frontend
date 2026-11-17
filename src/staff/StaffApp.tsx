// The staff portal. Shares only data (catalog) and UI primitives with the customer app.
import { Link, Route, Routes } from "react-router-dom";
import { CatalogProvider } from "../shared/catalog";
import { RequireStaff, StaffAuthProvider } from "./auth";
import { StaffLayout } from "./Layout";
import { StaffLogin } from "./Login";
import { ImportPage } from "./pages/Import";
import { StaffOrders } from "./pages/Orders";
import { Overview } from "./pages/Overview";
import { StaffProducts } from "./pages/Products";
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
  return (
    <div className="sx">
      <StaffAuthProvider>
        <CatalogProvider>
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
        </CatalogProvider>
      </StaffAuthProvider>
    </div>
  );
}
