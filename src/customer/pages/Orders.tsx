import { Link } from "react-router-dom";
import { money } from "../../shared/data";
import { OrderSummary } from "../parts";
import { itemCount } from "../../shared/orderlogic";
import { useMyOrders } from "../myOrders";

export function Orders() {
  const orders = useMyOrders();
  return (
    <div className="wrap page narrow">
      <h1>My orders</h1>
      {orders.length === 0 ? (
        <div className="empty">
          <h2>No orders yet</h2>
          <p className="muted">Orders you place show up here with their progress.</p>
          <Link to="/" className="btn primary inline">Start shopping</Link>
        </div>
      ) : (
        orders.map((o) => (
          <section key={o.id} className="order-card">
            <OrderSummary o={o} />
            <ul className="order-items">
              {o.items.map((i) => (
                <li key={i.id}><span>{i.name}{i.size && <span className="muted"> · {i.size}</span>} × {i.qty}</span><span>{money(i.price * i.qty)}</span></li>
              ))}
            </ul>
            <p className="order-total"><span>{itemCount(o)} {itemCount(o) === 1 ? "item" : "items"} · placed {new Date(`${o.date}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span><strong>{money(o.total)}</strong></p>
          </section>
        ))
      )}
    </div>
  );
}
