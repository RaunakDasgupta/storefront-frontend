import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCatalog } from "../shared/catalog";
import { money, type Product } from "../shared/data";
import { Icon, ProductImage } from "../shared/ui";
import { useCustomer } from "./auth";
import { useCart } from "./cart";
import { STEPS, STEP_MESSAGE, itemCount, type Order } from "../shared/orderlogic";
import { useOrders } from "../shared/orders";

/** Stock line under the size: green when plentiful, amber when low, red when gone. */
export function StockNote({ stock }: { stock: number }) {
  const tone = stock === 0 ? "out" : stock < 10 ? "low" : "ok";
  return <p className={`stock ${tone}`}><i />{stock === 0 ? "Out of stock" : stock < 10 ? `Only ${stock} left` : "In stock"}</p>;
}

export function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  return (
    <article className="pcard">
      <Link to={`/products/${p.id}`} className="pcard-link">
        <ProductImage p={p} />
        <h3>{p.name}</h3>
        {p.size && <p className="size">{p.size}</p>}
      </Link>
      <StockNote stock={p.stock} />
      <p className="price">{money(p.price)}{p.was && <s>{money(p.was)}</s>}</p>
      <button className="btn primary" disabled={p.stock === 0} onClick={() => add(p.id)}>{p.stock === 0 ? "Out of stock" : "Add to cart"}</button>
    </article>
  );
}

/** Cart beside the products: quantities, order total and the demo checkout. */
export function CartPanel() {
  const { lines, count, total, setQty, clear } = useCart();
  const { byId } = useCatalog();
  const { user } = useCustomer();
  const { place } = useOrders();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const items = lines.flatMap((l) => { const p = byId(l.id); return p ? [{ p, qty: l.qty }] : []; });

  function placeOrder() {
    if (!user) return navigate("/login", { state: { from: pathname } });
    place({ name: user.name, email: user.email }, items.map(({ p, qty }) => ({ id: p.id, name: p.name, size: p.size, qty, price: p.price })));
    clear();
    navigate("/orders");
  }

  return (
    <aside className="cartpanel" aria-label="Your cart">
      <h2>Your cart</h2>
      <p className="muted">{count} {count === 1 ? "item" : "items"}</p>

      {items.length === 0 ? (
        <p className="cart-empty">Your cart is empty. Add items to get started.</p>
      ) : (
        <ul className="cart-lines">
          {items.map(({ p, qty }) => (
            <li key={p.id}>
              <ProductImage p={p} small className="cart-thumb" />
              <div className="cart-name">
                <strong>{p.name}</strong>
                {p.size && <span className="muted">{p.size}</span>}
              </div>
              <div className="qty">
                <button aria-label={`Decrease ${p.name}`} onClick={() => setQty(p.id, qty - 1)}>−</button>
                <span aria-live="polite">{qty}</span>
                <button aria-label={`Increase ${p.name}`} onClick={() => setQty(p.id, qty + 1)}>+</button>
              </div>
              <strong className="line-total">{money(p.price * qty)}</strong>
            </li>
          ))}
        </ul>
      )}

      <p className="order-total"><span>Order total</span><strong>{money(total)}</strong></p>
      <button className="btn primary" disabled={items.length === 0} onClick={placeOrder}>Place demo order</button>
      <p className="demo-note"><Icon name="info" /> Demo checkout. No payment collected.</p>
    </aside>
  );
}

export function Tracker({ step }: { step: number }) {
  return (
    <ol className="tracker" aria-label="Order progress">
      {STEPS.map((s, i) => (
        <li key={s} className={i < step ? "done" : i === step ? "now" : ""} aria-current={i === step ? "step" : undefined}>
          <span className="dot">{i < step && <Icon name="check" />}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}

export function OrderSummary({ o }: { o: Order }) {
  return (
    <div className="order">
      <div>
        <h3>Order {o.id} <span className="muted">{itemCount(o)} {itemCount(o) === 1 ? "item" : "items"}</span></h3>
        <p className="muted">{STEP_MESSAGE[o.step]}</p>
      </div>
      <Tracker step={o.step} />
    </div>
  );
}
