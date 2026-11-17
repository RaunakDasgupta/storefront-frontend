import { useAuth } from "../auth";
import { orders } from "../data";
import { OrdersTable } from "./Staff";

export function Account() {
  const { user } = useAuth();
  return (
    <div className="wrap page">
      <h1>Hi, {user?.name.split(" ")[0]}</h1>
      <h2>Recent orders</h2>
      {/* shortcut: shows the shared mock orders; fetch this customer's own orders once there is an API. */}
      <div className="cardbox"><OrdersTable rows={orders.slice(0, 3)} /></div>
    </div>
  );
}
