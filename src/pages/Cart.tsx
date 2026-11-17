import { Link } from "react-router-dom";
import { byId, money } from "../data";
import { useCart } from "../cart";
import { ProductImage } from "../components";

export function CartPage() {
  const { lines, total, setQty } = useCart();

  if (lines.length === 0) {
    return (
      <div className="empty">
        <h1>Your cart is empty</h1>
        <p className="muted">Looks like you haven't added anything yet.</p>
        <Link to="/" className="btn primary inline">Continue shopping</Link>
      </div>
    );
  }

  return (
    <>
      <h1>Cart</h1>
      <ul className="lines">
        {lines.map(({ id, qty }) => {
          const p = byId(id);
          if (!p) return null;
          return (
            <li key={id}>
              <ProductImage p={p} />
              <div>
                <Link to={`/products/${id}`}>{p.name}</Link>
                <p className="muted">{money(p.price)}</p>
              </div>
              <div className="qty">
                <button aria-label={`Decrease ${p.name}`} onClick={() => setQty(id, qty - 1)}>−</button>
                <span aria-live="polite">{qty}</span>
                <button aria-label={`Increase ${p.name}`} onClick={() => setQty(id, qty + 1)}>+</button>
              </div>
              <strong>{money(p.price * qty)}</strong>
            </li>
          );
        })}
      </ul>
      <div className="summary">
        <p>Subtotal <strong>{money(total)}</strong></p>
        {/* shortcut: no payment provider yet; wire this to checkout when one is chosen. */}
        <button className="btn primary inline" disabled>Checkout coming soon</button>
      </div>
    </>
  );
}
