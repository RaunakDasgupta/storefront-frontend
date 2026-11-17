import { Link } from "react-router-dom";
import { money } from "../../shared/data";
import { revenueOf } from "../../shared/orderlogic";
import { useOrders } from "../../shared/orders";
import { OrdersTable } from "../../shared/ui";
import { useStaff } from "../auth";

export function Overview() {
  const { user } = useStaff();
  const { orders } = useOrders();
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Welcome back, {user?.name.split(" ")[0]}</h1>
          <p className="muted">Orders placed in the storefront show up here.</p>
        </div>
      </div>

      <div className="kpis">
        <section className="cardbox kpi"><p className="muted">Revenue</p><strong>{money(revenueOf(orders))}</strong></section>
        <section className="cardbox kpi"><p className="muted">Orders</p><strong>{orders.length}</strong></section>
      </div>

      <section className="cardbox">
        <header className="cardhead"><h2>Recent orders</h2><Link to="/staff/orders" className="link">View all orders</Link></header>
        <OrdersTable rows={orders.slice(0, 5)} />
      </section>
    </>
  );
}
