import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LoginDialog } from "./LoginDialog";
import { useToast } from "./toast";
import { useCatalog } from "../shared/catalog";
import { money, type Product } from "../shared/data";
import { STEPS } from "../shared/orderlogic";
import { useOrders } from "../shared/orders";
import { Icon, ProductImage } from "../shared/ui";
import { useCustomer, type User } from "./auth";
import { useCart } from "./cart";

/** Stock line under the size: green when plentiful, amber when low, red when gone. */
export function StockNote({ stock }: { stock: number }) {
  const tone = stock === 0 ? "out" : stock < 10 ? "low" : "ok";
  return <p className={`stock ${tone}`}><i />{stock === 0 ? "Out of stock" : stock < 10 ? `Only ${stock} left` : "In stock"}</p>;
}

/** Quantity stepper, also used inside the cart. */
export function Stepper({ name, qty, onChange }: { name: string; qty: number; onChange: (qty: number) => void }) {
  return (
    <div className="qty">
      <button aria-label={`Decrease ${name}`} onClick={() => onChange(qty - 1)}>−</button>
      <span aria-live="polite">{qty}</span>
      <button aria-label={`Increase ${name}`} onClick={() => onChange(qty + 1)}>+</button>
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { lines, add, setQty } = useCart();
  const inCart = lines.find((l) => l.id === p.id)?.qty ?? 0;
  return (
    <article className="pcard">
      <Link to={`/products/${p.id}`} className="pcard-link">
        <div className="pic"><ProductImage p={p} /></div>
        <h3>{p.name}</h3>
        {p.size && <p className="size">{p.size}</p>}
      </Link>
      <StockNote stock={p.stock} />
      <p className="price">{money(p.price)}{p.was && <s>{money(p.was)}</s>}</p>
      {inCart > 0 ? (
        <div className="in-cart"><Stepper name={p.name} qty={inCart} onChange={(q) => setQty(p.id, q)} /></div>
      ) : (
        <button className="btn primary" disabled={p.stock === 0} onClick={() => add(p.id)}>{p.stock === 0 ? "Out of stock" : "Add to cart"}</button>
      )}
    </article>
  );
}

/** A standalone category card: photo, name and product count, linking to that category's full list. */
export function CategoryCard({ name, count, cover, to, onClick }: { name: string; count: number; cover: Product; to: string; onClick?: () => void }) {
  return (
    <Link to={to} className="cat-card" onClick={onClick}>
      <ProductImage p={cover} />
      <span className="cat-card-label">
        <strong>{name}</strong>
        <small>{count} {count === 1 ? "product" : "products"}</small>
      </span>
    </Link>
  );
}

/** A loud call to action that switches between Retail and Bulk orders. Sits right under the intro so it is hard to miss. */
export function ChannelBanner({ channel }: { channel: "retail" | "bulk" }) {
  const { products } = useCatalog();
  const bulk = channel === "retail"; // the Retail page promotes Bulk, and the other way round
  const count = products.filter((p) => p.channel === (bulk ? "bulk" : "retail")).length;
  const c = bulk
    ? { to: "/bulk", tag: "Bulk orders", icon: "truck", title: "Buying in bulk?", text: "Order complete cartons or pallets for your business.", cta: `Browse ${count} bulk packs`, image: "/products/bulk-cartons.jpg" }
    : { to: "/", tag: "Retail", icon: "bag", title: "Need single packs?", text: "Shop individual items for your home.", cta: `Browse ${count} retail products`, image: "/products/tissue-box.jpg" } as const;
  return (
    <section className="bulk-banner" aria-labelledby="banner-title">
      <img className="pimg" src={c.image} alt="" width={1000} height={420} loading="eager" />
      <div className="bulk-copy">
        <span className="bulk-tag"><Icon name={c.icon as "truck" | "bag"} /> {c.tag}</span>
        <h2 id="banner-title">{c.title}</h2>
        <p>{c.text}</p>
      </div>
      <Link to={c.to} className="btn light inline">{c.cta}</Link>
    </section>
  );
}

/** Cart panel: quantities, order total and the demo checkout. */
export function CartPanel() {
  const { lines, count, total, setQty, clear } = useCart();
  const { byId } = useCatalog();
  const { user } = useCustomer();
  const { place } = useOrders();
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const { pathname } = useLocation();
  const items = lines.flatMap((l) => { const p = byId(l.id); return p ? [{ p, qty: l.qty }] : []; });
  const mixed = items.some(({ p }) => p.channel === "bulk") && items.some(({ p }) => p.channel === "retail");

  /** Places the order(s) for this customer. Retail and bulk items are fulfilled separately, so they become separate orders. */
  function placeFor(who: User) {
    const line = ({ p, qty }: (typeof items)[number]) => ({ id: p.id, name: p.name, size: p.size, qty, price: p.price });
    const made = place({ name: who.name, email: who.email }, [
      { channel: "retail", items: items.filter(({ p }) => p.channel === "retail").map(line) },
      { channel: "bulk", items: items.filter(({ p }) => p.channel === "bulk").map(line) },
    ]);
    clear();
    // stay on the page: confirm with a small popup that links to the order(s)
    toast.show(made.length > 1
      ? { message: `Orders placed: ${made.map((o) => o.id).join(" and ")}`, actionLabel: "View orders", to: "/orders" }
      : { message: `Order ${made[0].id} placed`, actionLabel: "View order", to: "/orders" });
  }

  // logged out: ask them to log in right here instead of sending them to another page
  const placeOrder = () => (user ? placeFor(user) : setAsking(true));

  return (
    <aside className="cartpanel" aria-label="Your cart">
      <div className="cart-head">
        <h2>Your cart</h2>
        <span className="cart-count">{count} {count === 1 ? "item" : "items"}</span>
      </div>

      {items.length === 0 ? (
        <div className="cart-empty">
          <span className="cart-empty-icon"><Icon name="bag" /></span>
          <strong>Your cart is empty</strong>
          <span>Add items to get started.</span>
        </div>
      ) : (
        <ul className="cart-lines">
          {items.map(({ p, qty }) => (
            <li key={p.id}>
              <ProductImage p={p} small className="cart-thumb" />
              <div className="cart-name">
                <strong>{p.name}</strong>
                {p.size && <span className="muted">{p.size}</span>}
              </div>
              <Stepper name={p.name} qty={qty} onChange={(q) => setQty(p.id, q)} />
              <strong className="line-total">{money(p.price * qty)}</strong>
            </li>
          ))}
        </ul>
      )}

      <p className="order-total"><span>Order total</span><strong>{money(total)}</strong></p>
      <button className="btn primary" disabled={items.length === 0} onClick={placeOrder}>Place demo order</button>
      {mixed && <p className="demo-note"><Icon name="truck" /> Retail and bulk items are placed as two separate orders.</p>}
      <p className="demo-note"><Icon name="info" /> Demo checkout. No payment collected.</p>
      {asking && <LoginDialog from={pathname} onClose={() => setAsking(false)} onLoggedIn={(u) => { setAsking(false); placeFor(u); }} />}
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
