import { Link } from "react-router-dom";
import { useCatalog } from "../../shared/hooks/useCatalog";
import { useOrders } from "../../shared/hooks/useOrders";
import { fmtDate, money } from "../../shared/lib/data";
import { STEPS, countByStep, revenueByDay, revenueOf } from "../../shared/lib/orderlogic";
import { STEP_BADGE } from "../../shared/ui";
import { RevenueChart, StatusBars } from "../components/Charts";

const LOW_STOCK = 10;

/** The dashboard: headline numbers, revenue and fulfilment charts, the newest orders and what is running low. */
export function Overview() {
  const { orders } = useOrders();
  const { products } = useCatalog();

  const retail = orders.filter((o) => o.channel === "retail"), bulk = orders.filter((o) => o.channel === "bulk");
  const counts = countByStep(orders);
  const open = orders.length - counts[3];
  const low = products.filter((p) => p.stock < LOW_STOCK).sort((a, b) => a.stock - b.stock);
  const kpis = [
    { label: "Revenue", value: money(revenueOf(orders)), sub: `Retail ${money(revenueOf(retail))} · Bulk ${money(revenueOf(bulk))}` },
    { label: "Orders", value: String(orders.length), sub: `Retail ${retail.length} · Bulk ${bulk.length}` },
    { label: "Average order", value: money(orders.length ? Math.round(revenueOf(orders) / orders.length) : 0), sub: "Revenue per order" },
    { label: "To fulfil", value: String(open), sub: open === 1 ? "Order not yet ready for dispatch" : "Orders not yet ready for dispatch" },
  ];

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Overview</h1>
          <p className="muted">How the store is doing. Orders placed in the storefront show up here straight away.</p>
        </div>
      </div>

      <div className="kpis">
        {kpis.map((k) => (
          <section key={k.label} className="cardbox kpi" aria-label={k.label}>
            <h2>{k.label}</h2>
            <strong>{k.value}</strong>
            <p className="muted">{k.sub}</p>
          </section>
        ))}
      </div>

      <div className="dash-row">
        <section className="cardbox dash-card" aria-label="Revenue by day">
          <header className="cardhead"><h2>Revenue by day</h2><span className="muted">Last 7 days of orders</span></header>
          <div className="dash-body">{orders.length ? <RevenueChart days={revenueByDay(orders)} /> : <p className="muted">No orders yet.</p>}</div>
        </section>
        <section className="cardbox dash-card" aria-label="Orders by status">
          <header className="cardhead"><h2>Orders by status</h2><Link to="/admin/orders" className="link">Manage</Link></header>
          <div className="dash-body"><StatusBars counts={counts} /></div>
        </section>
      </div>

      <div className="dash-row">
        <section className="cardbox dash-card" aria-label="Recent orders">
          <header className="cardhead"><h2>Recent orders</h2><Link to="/admin/orders" className="link">View all {orders.length}</Link></header>
          {orders.length === 0 ? <div className="dash-body"><p className="muted">No orders yet.</p></div> : (
            <div className="tablewrap">
              <table>
                <thead><tr><th>Order</th><th>Customer</th><th className="hide-sm">Type</th><th>Status</th><th className="num">Total</th></tr></thead>
                <tbody>
                  {orders.slice(0, 8).map((o) => (
                    <tr key={o.id}>
                      <td><Link to={`/admin/orders?type=${o.channel}&q=${o.id}`} className="link"><strong>{o.id}</strong></Link><span className="muted"> {fmtDate(o.date)}</span></td>
                      <td>{o.customer.name}</td>
                      <td className="hide-sm">{o.channel === "bulk" ? "Bulk" : "Retail"}</td>
                      <td><span className={`badge ${STEP_BADGE[o.step]}`}>{STEPS[o.step]}</span></td>
                      <td className="num">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="cardbox dash-card" aria-label="Low stock">
          <header className="cardhead"><h2>Low stock</h2><Link to="/admin/products?stock=low" className="link">View all {low.length}</Link></header>
          <div className="dash-body">
            {low.length === 0 ? <p className="muted">Every product has {LOW_STOCK} or more in stock.</p> : (
              <ul className="low-list">
                {low.slice(0, 6).map((p) => <li key={p.id}><span>{p.name}{p.size && <span className="muted"> · {p.size}</span>}</span><strong className={p.stock === 0 ? "out" : undefined}>{p.stock === 0 ? "Out" : `${p.stock} left`}</strong></li>)}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
