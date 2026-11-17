import { Link } from "react-router-dom";
import { useAuth } from "../auth";
import { money, orders, products, type Order } from "../data";

export function OrdersTable({ rows }: { rows: Order[] }) {
  return (
    <div className="tablewrap">
      <table>
        <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Status</th><th className="num">Total</th></tr></thead>
        <tbody>
          {rows.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td><td>{o.customer}</td><td>{o.date}</td>
              <td><span className={`badge ${o.status.toLowerCase()}`}>{o.status}</span></td>
              <td className="num">{money(o.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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
      <h1>Welcome back, <span className="cap">{user?.name}</span></h1>
      <section className="cardbox">
        <div className="stats">
          {stats.map(([label, value]) => (
            <div key={label} className="stat"><p className="muted">{label}</p><strong>{value}</strong></div>
          ))}
        </div>
      </section>
      <section className="cardbox">
        <header className="cardhead"><h2>Recent orders</h2><Link to="/staff/orders" className="link">View all orders</Link></header>
        <OrdersTable rows={orders.slice(0, 4)} />
      </section>
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
