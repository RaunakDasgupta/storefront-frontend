import { Link } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import { money, orders, revenueOf, salesByDay } from "../../shared/data";
import { OrdersTable } from "../../shared/ui";
import { useStaff } from "../auth";

function Kpis() {
  const { products } = useCatalog();
  const revenue = revenueOf(orders);
  const counted = orders.filter((o) => o.status !== "Pending").length;
  const kpis = [
    { label: "Revenue", value: money(revenue) },
    { label: "Orders", value: String(orders.length) },
    { label: "Average order", value: money(Math.round(revenue / Math.max(1, counted))) },
    { label: "SKUs", value: String(products.length) },
  ];
  return (
    <div className="kpis">
      {kpis.map((k) => (
        <section key={k.label} className="cardbox kpi"><p className="muted">{k.label}</p><strong>{k.value}</strong></section>
      ))}
    </div>
  );
}

function SalesChart() {
  const days = salesByDay();
  const max = Math.max(1, ...days.map((d) => d.total));
  const week = days.reduce((s, d) => s + d.total, 0);
  return (
    <section className="cardbox">
      <header className="cardhead"><h2>Sales, last 7 days</h2><strong>{money(week)}</strong></header>
      <div className="chart" role="img" aria-label={`Sales per day: ${days.map((d) => `${d.day} ${money(d.total)}`).join(", ")}`}>
        {days.map((d) => (
          <div className="bar-col" key={d.iso}>
            <span className="bar-val">{d.total ? money(d.total) : ""}</span>
            <div className="bar" style={{ height: `${(d.total / max) * 100}%` }} />
            <span className="bar-day">{d.day}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/** The two things staff can act on, each one click away from the list to work through. */
function Attention() {
  const { products } = useCatalog();
  const pending = orders.filter((o) => o.status === "Pending").length;
  const low = products.filter((p) => p.stock < 10).length;
  const items = [
    { n: pending, text: pending === 1 ? "order waiting for payment" : "orders waiting for payment", to: "/staff/orders?status=Pending" },
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
  return (
    <>
      <div className="page-head">
        <div>
          <h1>Welcome back, {user?.name.split(" ")[0]}</h1>
          <p className="muted">How the store did over the last 7 days.</p>
        </div>
      </div>
      <Kpis />
      <div className="dash-grid">
        <SalesChart />
        <Attention />
      </div>
      <section className="cardbox">
        <header className="cardhead"><h2>Recent orders</h2><Link to="/staff/orders" className="link">View all orders</Link></header>
        <OrdersTable rows={orders.slice(0, 5)} />
      </section>
    </>
  );
}
