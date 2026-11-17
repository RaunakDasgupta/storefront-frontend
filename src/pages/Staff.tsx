import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { money, orders, products, salesByDay, unitsSold, type Order } from "../data";

export function OrdersTable({ rows }: { rows: Order[] }) {
  return (
    <div className="tablewrap">
      <table>
        <thead><tr><th>Order</th><th>Customer</th><th className="hide-sm">Date</th><th>Status</th><th className="num">Total</th></tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td><td>{o.customer}</td><td className="hide-sm">{o.date}</td>
              <td><span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
              <td className="num">{money(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SalesChart() {
  const max = Math.max(...salesByDay.map((d) => d.total));
  const week = salesByDay.reduce((s, d) => s + d.total, 0);
  return (
    <section className="cardbox">
      <header className="cardhead"><h2>Sales, last 7 days</h2><strong>{money(week)}</strong></header>
      <div className="chart" role="img" aria-label={`Sales per day: ${salesByDay.map((d) => `${d.day} ${money(d.total)}`).join(", ")}`}>
        {salesByDay.map((d) => (
          <div className="bar-col" key={d.day}>
            <span className="bar-val">{money(d.total)}</span>
            <div className="bar" style={{ height: `${(d.total / max) * 100}%` }} />
            <span className="bar-day">{d.day}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function TopProducts() {
  const ranked = [...products].sort((a, b) => unitsSold[b.id] - unitsSold[a.id]).slice(0, 5);
  const max = unitsSold[ranked[0].id];
  return (
    <section className="cardbox">
      <header className="cardhead"><h2>Top products</h2></header>
      <ul className="ranklist">
        {ranked.map((p) => (
          <li key={p.id}>
            <span className="rank-name">{p.emoji} {p.name}</span>
            <span className="muted">{unitsSold[p.id]} sold</span>
            <span className="meter" aria-hidden="true"><i style={{ width: `${(unitsSold[p.id] / max) * 100}%` }} /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LowStock() {
  const low = products.filter((p) => p.stock < 10).sort((a, b) => a.stock - b.stock);
  return (
    <section className="cardbox">
      <header className="cardhead"><h2>Low stock</h2><Link to="/staff/products" className="link">View products</Link></header>
      <ul className="ranklist">
        {low.map((p) => (
          <li key={p.id} className="stockrow">
            <span className="rank-name">{p.emoji} {p.name}</span>
            <span className="badge pending">{p.stock === 0 ? "Out of stock" : `${p.stock} left`}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function Overview() {
  const { user } = useAuth();
  const revenue = orders.filter((o) => o.status !== "Pending").reduce((s, o) => s + o.total, 0);
  const stats = [
    ["Revenue", money(revenue)],
    ["Orders", String(orders.length)],
    ["Pending", String(orders.filter((o) => o.status === "Pending").length)],
    ["Low stock", String(products.filter((p) => p.stock < 10).length)],
  ];
  return (
    <>
      <h1>Welcome back, {user?.name.split(" ")[0]}</h1>
      <section className="cardbox">
        <div className="stats">
          {stats.map(([label, value]) => (
            <div key={label} className="stat"><p className="muted">{label}</p><strong>{value}</strong></div>
          ))}
        </div>
      </section>
      <div className="two-col">
        <div>
          <SalesChart />
          <section className="cardbox">
            <header className="cardhead"><h2>Recent orders</h2><Link to="/staff/orders" className="link">View all orders</Link></header>
            <OrdersTable rows={orders.slice(0, 4)} />
          </section>
        </div>
        <div>
          <TopProducts />
          <LowStock />
        </div>
      </div>
    </>
  );
}

export function StaffOrders() {
  return (<><h1>Orders</h1><section className="cardbox"><OrdersTable rows={orders} /></section></>);
}

export function StaffProducts() {
  return (
    <>
      <h1>Products</h1>
      <section className="cardbox">
        <div className="tablewrap">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th className="num">Price</th><th className="num">Inventory</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.emoji} {p.name}</td><td>{p.category}</td><td className="num">{money(p.price)}</td>
                  <td className="num">{p.stock === 0 ? <span className="badge pending">Out of stock</span> : p.stock < 10 ? <span className="badge pending">{p.stock} left</span> : p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
