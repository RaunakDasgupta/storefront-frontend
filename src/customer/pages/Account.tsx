import { orders } from "../../shared/data";
import { OrdersTable } from "../../shared/ui";
import { useCustomer } from "../auth";

export function Account() {
  const { user, signOut } = useCustomer();
  return (
    <div className="wrap page">
      <h1>Hi, {user?.name.split(" ")[0]}</h1>
      <section className="cardbox profile">
        <div><p className="muted">Name</p><strong>{user?.name}</strong></div>
        <div><p className="muted">Email</p><strong>{user?.email}</strong></div>
        <button className="btn secondary inline" onClick={signOut}>Log out</button>
      </section>
      <h2>Recent orders</h2>
      {/* shortcut: shows the shared sample orders; fetch this customer's own orders once there is an API. */}
      <div className="cardbox"><OrdersTable rows={orders.slice(0, 3)} /></div>
    </div>
  );
}
