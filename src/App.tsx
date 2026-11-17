import { Route, Routes } from "react-router-dom";
import { RequireRole } from "./auth";
import { StaffLayout, StoreLayout } from "./components";
import { LoginPage } from "./LoginPage";
import { SignupPage } from "./SignupPage";
import { Account } from "./pages/Account";
import { CartPage } from "./pages/Cart";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { ProductPage } from "./pages/Product";
import { Overview, StaffOrders, StaffProducts } from "./pages/Staff";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<StoreLayout />}>
        <Route index element={<Home />} />
        <Route path="products/:id" element={<ProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="account" element={<RequireRole role="customer"><Account /></RequireRole>} />
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route path="staff" element={<RequireRole role="employee"><StaffLayout /></RequireRole>}>
        <Route index element={<Overview />} />
        <Route path="orders" element={<StaffOrders />} />
        <Route path="products" element={<StaffProducts />} />
      </Route>
    </Routes>
  );
}
