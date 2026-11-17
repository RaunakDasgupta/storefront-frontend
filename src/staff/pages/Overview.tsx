import { Link } from "react-router-dom";
import { money, type Channel } from "../../shared/data";
import { revenueOf } from "../../shared/orderlogic";
import { useOrders } from "../../shared/orders";
import { OrderGrid } from "../OrderGrid";
import { useStaff } from "../auth";

const CHANNELS: { id: Channel; label: string }[] = [
  { id: "retail", label: "Retail" },
  { id: "bulk", label: "Bulk" },
];

export function Overview() {
  const { user } = useStaff();
  const { orders } = useOrders();
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Welcome back, {user?.name.split(" ")[0]}</h1>
          <p className="muted">Orders placed in the storefront show up here, retail and bulk kept apart.</p>
        </div>
      </div>

      <div className="kpis">
        {CHANNELS.map((c) => {
          const list = orders.filter((o) => o.channel === c.id);
          return (
            <section key={c.id} className="cardbox kpi" aria-label={`${c.label} summary`}>
              <h2>{c.label}</h2>
              <div className="kpi-stats">
                <div><p className="muted">Revenue</p><strong>{money(revenueOf(list))}</strong></div>
                <div><p className="muted">Orders</p><strong>{list.length}</strong></div>
              </div>
            </section>
          );
        })}
      </div>

      {CHANNELS.map((c) => {
        const list = orders.filter((o) => o.channel === c.id);
        return (
          <section key={c.id} className="orders-block" aria-label={`Recent ${c.label.toLowerCase()} orders`}>
            <header className="block-head">
              <h2>Recent {c.label.toLowerCase()} orders</h2>
              <Link to={`/staff/orders${c.id === "bulk" ? "?type=bulk" : ""}`} className="link">View all {list.length} {c.label.toLowerCase()} orders</Link>
            </header>
            {list.length === 0 ? <p className="muted">No {c.label.toLowerCase()} orders yet.</p> : <OrderGrid orders={list.slice(0, 12)} />}
          </section>
        );
      })}
    </>
  );
}
