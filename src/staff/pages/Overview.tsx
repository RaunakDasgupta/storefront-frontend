import { Link } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import { money } from "../../shared/data";
import { revenueOf } from "../../shared/orderlogic";
import { useOrders } from "../../shared/orders";
import { OrdersTable } from "../../shared/ui";
import { useStaff } from "../auth";

/** The two things staff can act on, each one click away from the list to work through. */
function Attention() {
  const { products } = useCatalog();
  const { orders } = useOrders();
  const waiting = orders.filter((o) => o.step === 0).length;
  const low = products.filter((p) => p.stock < 10).length;
  const items = [
    { n: waiting, text: waiting === 1 ? "new order waiting to be prepared" : "new orders waiting to be prepared", to: "/staff/orders?status=Confirmed" },
    { n: low, text: low === 1 ? "SKU low or out of stock" : "SKUs low or out of stock", to: "/staff/products?stock=low" },
  ].filter((i) => i.n > 0);
  return (
    <section className="cardbox">
      <header className="cardhead"><h2>Needs attention</h2></header>
      {items.length === 0 ? <p className="muted pad">Nothing needs attention right now.</p> : (
        <ul className="todo">
          {items.map((i) => (
            <li key={i.to}><Link to={i.to}><strong>{i.n}</strong><span>{i.text}</span><span className="link">Review</span></Link></li>
          ))}
        </ul>
      )}
    </section>
  );
}

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

      <Attention />

      <section className="cardbox">
        <header className="cardhead"><h2>Recent orders</h2><Link to="/staff/orders" className="link">View all orders</Link></header>
        <OrdersTable rows={orders.slice(0, 5)} />
      </section>
    </>
  );
}
