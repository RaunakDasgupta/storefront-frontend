import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth";
import { useCatalog } from "../catalog";
import { ProductImage } from "../components";
import { fmtDate, money, orders, revenueOf, salesByDay, unitsSold, type Order } from "../data";
import { ImportCard } from "./ImportCard";

export function OrdersTable({ rows }: { rows: Order[] }) {
  return (
    <div className="tablewrap">
      <table>
        <thead><tr><th>Order</th><th>Customer</th><th className="hide-sm">Date</th><th>Status</th><th className="num">Total</th></tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td><td>{o.customer}</td><td className="hide-sm">{fmtDate(o.date)}</td>
              <td><span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
              <td className="num">{money(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Kpis() {
  const { products } = useCatalog();
  const revenue = revenueOf(orders);
  const counted = orders.filter((o) => o.status !== "Pending");
  const low = products.filter((p) => p.stock < 10).length;
  const kpis = [
    { label: "Revenue", value: money(revenue), note: `From ${counted.length} paid or fulfilled orders` },
    { label: "Orders", value: String(orders.length), note: `${orders.filter((o) => o.status === "Pending").length} waiting for payment` },
    { label: "Average order", value: money(Math.round(revenue / counted.length)), note: "Paid and fulfilled orders" },
    { label: "SKUs", value: String(products.length), note: `${low} low or out of stock` },
  ];
  return (
    <div className="kpis">
      {kpis.map((k) => (
        <section key={k.label} className="cardbox kpi">
          <p className="muted">{k.label}</p>
          <strong>{k.value}</strong>
          <p className="muted">{k.note}</p>
        </section>
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

function OrderStatus() {
  const parts = (["Fulfilled", "Paid", "Pending"] as const).map((s) => ({ s, n: orders.filter((o) => o.status === s).length }));
  return (
    <section className="cardbox">
      <header className="cardhead"><h2>Orders by status</h2><span className="muted">{orders.length} orders</span></header>
      <div className="statusbar" role="img" aria-label={parts.map((p) => `${p.n} ${p.s}`).join(", ")}>
        {parts.map((p) => <i key={p.s} className={p.s.toLowerCase()} style={{ flexGrow: p.n }} />)}
      </div>
      <ul className="legend">
        {parts.map((p) => <li key={p.s}><i className={`dot ${p.s.toLowerCase()}`} />{p.s}<strong>{p.n}</strong></li>)}
      </ul>
    </section>
  );
}

function TopProducts() {
  const { products } = useCatalog();
  const ranked = products.filter((p) => (unitsSold[p.sku] ?? 0) > 0).sort((a, b) => unitsSold[b.sku] - unitsSold[a.sku]).slice(0, 5);
  const max = ranked.length ? unitsSold[ranked[0].sku] : 1;
  return (
    <section className="cardbox">
      <header className="cardhead"><h2>Top products</h2><span className="muted">Units sold</span></header>
      <ul className="ranklist">
        {ranked.map((p) => (
          <li key={p.id}>
            <span className="rank-name"><ProductImage p={p} className="thumb" small eager />{p.name}</span>
            <span className="muted">{unitsSold[p.sku]}</span>
            <span className="meter" aria-hidden="true"><i style={{ width: `${(unitsSold[p.sku] / max) * 100}%` }} /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LowStock() {
  const { products } = useCatalog();
  const low = products.filter((p) => p.stock < 10).sort((a, b) => a.stock - b.stock).slice(0, 6);
  return (
    <section className="cardbox">
      <header className="cardhead"><h2>Low stock</h2><Link to="/staff/products" className="link">View products</Link></header>
      {low.length === 0 ? <p className="muted pad">Every SKU has 10 or more in stock.</p> : (
        <ul className="ranklist">
          {low.map((p) => (
            <li key={p.id} className="stockrow">
              <span className="rank-name"><ProductImage p={p} className="thumb" small eager />{p.name}</span>
              <span className="badge pending">{p.stock === 0 ? "Out of stock" : `${p.stock} left`}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Overview() {
  const { user } = useAuth();
  const { hash } = useLocation();

  // lets /staff#import scroll to the upload section
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  return (
    <>
      <div className="dash-head">
        <div>
          <h1>Welcome back, {user?.name.split(" ")[0]}</h1>
          <p className="muted">How the store did over the last 7 days.</p>
        </div>
        <div className="dash-actions">
          <Link to="/" className="btn secondary inline">View store</Link>
          <a href="#import" className="btn primary inline">Import SKUs</a>
        </div>
      </div>

      <Kpis />

      <div className="dash-grid">
        <div>
          <SalesChart />
          <OrderStatus />
        </div>
        <div>
          <TopProducts />
          <LowStock />
        </div>
      </div>

      <section className="cardbox">
        <header className="cardhead"><h2>Recent orders</h2><Link to="/staff/orders" className="link">View all orders</Link></header>
        <OrdersTable rows={orders.slice(0, 5)} />
      </section>

      <ImportCard />
    </>
  );
}

export function StaffOrders() {
  return (<><h1>Orders</h1><section className="cardbox"><OrdersTable rows={orders} /></section></>);
}

export function StaffProducts() {
  const { products, customized, reset } = useCatalog();
  return (
    <>
      <div className="dash-head">
        <h1>Products</h1>
        <div className="dash-actions">
          {customized && (
            <button className="btn secondary inline" onClick={() => { if (window.confirm("Reset the catalog to the 8 sample products? Imported SKUs will be removed from this browser.")) reset(); }}>
              Reset catalog
            </button>
          )}
          <Link to="/staff#import" className="btn primary inline">Import SKUs</Link>
        </div>
      </div>
      <section className="cardbox">
        <div className="tablewrap">
          <table>
            <thead><tr><th>Product</th><th>SKU</th><th className="hide-sm">Category</th><th className="num">Price</th><th className="num">Inventory</th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><span className="rank-name"><ProductImage p={p} className="thumb" small eager />{p.name}</span></td>
                  <td>{p.sku}</td>
                  <td className="hide-sm">{p.category}</td>
                  <td className="num">{money(p.price)}</td>
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
