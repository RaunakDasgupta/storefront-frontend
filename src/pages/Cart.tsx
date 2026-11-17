import { Link } from "react-router-dom";
import { useCatalog } from "../catalog";
import { money } from "../data";
import { useCart } from "../cart";
import { ProductImage } from "../components";

export function CartPage() {
  const { lines, total, setQty } = useCart();
  const { byId } = useCatalog();

  if (lines.length === 0) {
    return (
      <div className="wrap page empty">
        <h1>Your cart is empty</h1>
        <Link to="/" className="btn primary inline">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="wrap page">
      <div className="section-head">
        <h1>Your cart</h1>
        <Link to="/" className="link">Continue shopping</Link>
      </div>
      <ul className="lines">
        {lines.map(({ id, qty }) => {
          const p = byId(id);
          if (!p) return null;
          return (
            <li key={id}>
              <ProductImage p={p} small />
              <div>
                <Link to={`/products/${id}`} className="pname">{p.name}</Link>
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
        <p className="total">Estimated total <strong>{money(total)}</strong></p>
        <p className="muted">Taxes and shipping are calculated at checkout.</p>
        {/* shortcut: no payment provider yet; wire this to checkout when one is chosen. */}
        <button className="btn primary" disabled>Check out</button>
      </div>
    </div>
  );
}
