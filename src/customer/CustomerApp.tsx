// The customer storefront ("Everyday Market"). Shares only data (catalog) and UI primitives with the staff app.
import { Route, Routes } from "react-router-dom";
import { CatalogProvider } from "../shared/catalog";
import { OrdersProvider } from "../shared/orders";
import { CustomerAuthProvider } from "./auth";
import { AuthDialogProvider, AuthRoute, RequireCustomer } from "./authDialog";
import { CartProvider } from "./cart";
import { CustomerLayout } from "./Layout";
import { ToastProvider } from "./toast";
import { Account } from "./pages/Account";
import { CartPage } from "./pages/Cart";
import { Categories } from "./pages/Categories";
import { NotFound } from "./pages/NotFound";
import { Orders } from "./pages/Orders";
import { ProductPage } from "./pages/Product";
import { Shop } from "./pages/Shop";
import "./customer.css";

export default function CustomerApp() {
  return (
    <div className="cx">
      <CustomerAuthProvider>
        <CatalogProvider>
          <CartProvider>
            <OrdersProvider>
              <ToastProvider>
              <AuthDialogProvider>
              <Routes>
                <Route path="login" element={<AuthRoute mode="login" />} />
                <Route path="signup" element={<AuthRoute mode="signup" />} />
                <Route element={<CustomerLayout />}>
                  <Route index element={<Shop channel="retail" />} />
                  <Route path="bulk" element={<Shop channel="bulk" />} />
                  <Route path="products/:id" element={<ProductPage />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="orders" element={<RequireCustomer><Orders /></RequireCustomer>} />
                  <Route path="account" element={<RequireCustomer><Account /></RequireCustomer>} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
              </AuthDialogProvider>
              </ToastProvider>
            </OrdersProvider>
          </CartProvider>
        </CatalogProvider>
      </CustomerAuthProvider>
    </div>
  );
}
