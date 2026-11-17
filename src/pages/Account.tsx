import { useAuth } from "../auth";
import { orders } from "../data";
import { OrdersTable } from "./Staff";

export function Account() {
  const { user } = useAuth();
  return (
    <>
      <h1>Hi, {user?.name}</h1>
      <h2>Recent orders</h2>
      {/* shortcut: shows the shared mock orders; fetch this customer's own orders once there is an API. */}
      <OrdersTable rows={orders.slice(0, 3)} />
    </>
  );
}
