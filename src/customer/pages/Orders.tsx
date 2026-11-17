import { useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import { money } from "../../shared/data";
import { STEPS, STEP_MESSAGE, itemCount, type Order } from "../../shared/orderlogic";
import { Icon, ProductImage, STEP_BADGE } from "../../shared/ui";
import { useCart } from "../cart";
import { useMyOrders } from "../myOrders";
import { Tracker } from "../parts";
import { useToast } from "../toast";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "retail", label: "Retail" },
  { id: "bulk", label: "Bulk" },
] as const;

const when = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function OrderCard({ o }: { o: Order }) {
  const { byId } = useCatalog();
  const { add } = useCart();
  const toast = useToast();
  const products = o.items.flatMap((i) => { const p = byId(i.id); return p ? [p] : []; });
  const photos = products.slice(0, 4);
  const extra = o.items.length - photos.length;

  function orderAgain() {
    const available = o.items.filter((i) => (byId(i.id)?.stock ?? 0) > 0);
    available.forEach((i) => add(i.id, i.qty));
    toast.show(available.length
      ? { message: `${available.length} ${available.length === 1 ? "item" : "items"} from ${o.id} added to your cart`, actionLabel: "View cart", to: "/cart" }
      : { message: "Those items are out of stock right now" });
  }

  return (
    <article className="ord">
      <header className="ord-top">
        <div className="ord-id">
          <h2>{o.id}</h2>
          <span className={`chan ${o.channel}`}>{o.channel === "bulk" ? "Bulk" : "Retail"}</span>
          <span className="muted">Placed {when(o.date)} · {itemCount(o)} {itemCount(o) === 1 ? "item" : "items"}</span>
        </div>
        <div className="ord-right">
          <span className={`badge ${STEP_BADGE[o.step]}`}>{STEPS[o.step]}</span>
          <strong className="ord-total">{money(o.total)}</strong>
        </div>
      </header>

      <div className="ord-items">
        <div className="ord-photos" aria-hidden="true">
          {photos.map((p) => <ProductImage key={p.id} p={p} small className="ord-photo" />)}
          {extra > 0 && <span className="ord-more">+{extra}</span>}
        </div>
        <p className="ord-names">{o.items.map((i) => i.name).join(", ")}</p>
      </div>

      <div className="ord-status">
        <Tracker step={o.step} />
        <p>{STEP_MESSAGE[o.step]}</p>
      </div>

      <details className="ord-details">
        <summary>View items</summary>
        <ul>
          {o.items.map((i) => (
            <li key={i.id}>
              <span>{i.name}{i.size && <span className="muted"> · {i.size}</span>} × {i.qty}</span>
              <span>{money(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
      </details>

      <footer className="ord-foot">
        <button className="btn secondary inline" onClick={orderAgain}>Order again</button>
      </footer>
    </article>
  );
}

export function Orders() {
  const orders = useMyOrders();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const shown = orders.filter((o) => filter === "all" || o.channel === filter);
  const active = orders.filter((o) => o.step < 3).length;

  return (
    <div className="wrap page narrow">
      <header className="orders-head">
        <div>
          <h1>My orders</h1>
          <p className="muted">{orders.length === 0 ? "Track everything you order here." : `${orders.length} ${orders.length === 1 ? "order" : "orders"} · ${active} in progress`}</p>
        </div>
        {orders.length > 0 && (
          <div className="order-filter" role="group" aria-label="Filter orders">
            {FILTERS.map((f) => (
              <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label} <span>{f.id === "all" ? orders.length : orders.filter((o) => o.channel === f.id).length}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {orders.length === 0 ? (
        <div className="empty orders-empty">
          <span className="cart-empty-icon"><Icon name="orders" /></span>
          <h2>No orders yet</h2>
          <p className="muted">Orders you place show up here with their progress.</p>
          <Link to="/" className="btn primary inline">Start shopping</Link>
        </div>
      ) : shown.length === 0 ? (
        <p className="muted">No {filter} orders yet.</p>
      ) : (
        <div className="ord-list">{shown.map((o) => <OrderCard key={o.id} o={o} />)}</div>
      )}
    </div>
  );
}
