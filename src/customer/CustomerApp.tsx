// The customer storefront. Shares only data (catalog) and UI primitives with the staff app.
import { Route, Routes } from "react-router-dom";
import { CatalogProvider } from "../shared/catalog";
import { RequireCustomer, CustomerAuthProvider } from "./auth";
import { CartProvider } from "./cart";
import { CustomerLayout } from "./Layout";
import { Login } from "./Login";
import { Signup } from "./Signup";
import { Account } from "./pages/Account";
import { CartPage } from "./pages/Cart";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { ProductPage } from "./pages/Product";
import { Shop } from "./pages/Shop";
import "./customer.css";

export default function CustomerApp() {
  return (
    <div className="cx">
      <CustomerAuthProvider>
        <CatalogProvider>
          <CartProvider>
            <Routes>
              <Route path="login" element={<Login />} />
              <Route path="signup" element={<Signup />} />
              <Route element={<CustomerLayout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                <Route path="products/:id" element={<ProductPage />} />
                <Route path="cart" element={<CartPage />} />
                <Route path="account" element={<RequireCustomer><Account /></RequireCustomer>} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </CartProvider>
        </CatalogProvider>
      </CustomerAuthProvider>
    </div>
  );
}
