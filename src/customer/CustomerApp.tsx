// The customer storefront ("Everyday Market"). Shares only data (catalog) and UI primitives with the staff app.
import { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { Route, Routes } from "react-router-dom";
import { AuthDialogHost, AuthRoute, RequireCustomer } from "./components/AuthDialog";
import { CustomerLayout } from "./components/Layout";
import { makeCustomerStore, persistCustomer } from "./store/store";
import { ToastHost } from "./components/Toast";
import { Account } from "./pages/Account";
import { CartPage } from "./pages/Cart";
import { Categories } from "./pages/Categories";
import { NotFound } from "./pages/NotFound";
import { Orders } from "./pages/Orders";
import { ProductPage } from "./pages/Product";
import { Shop } from "./pages/Shop";
import "./customer.css";

export default function CustomerApp() {
  // this app's own store: the staff portal has another one
  const [store] = useState(makeCustomerStore);
  useEffect(() => persistCustomer(store), [store]);

  return (
    <div className="cx">
      <Provider store={store}>
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
        <ToastHost />
        <AuthDialogHost />
      </Provider>
    </div>
  );
}
