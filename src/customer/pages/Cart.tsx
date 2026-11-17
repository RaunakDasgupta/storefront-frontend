import { Link } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import { money } from "../../shared/data";
import { ProductImage } from "../../shared/ui";
import { useCart } from "../cart";

export function CartPage() {
  const { lines, total, setQty } = useCart();
  const { byId } = useCatalog();

  if (lines.length === 0) {
    return (
      <div className="wrap page empty">
        <h1>Your cart is empty</h1>
        <Link to="/shop" className="btn primary inline">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="wrap page">
      <div className="section-head">
        <h1>Your cart</h1>
        <Link to="/shop" className="link">Continue shopping</Link>
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
        <p className="muted">{total >= 999 ? "You qualify for free shipping." : `Add ${money(999 - total)} more for free shipping.`}</p>
        {/* shortcut: no payment provider yet; wire this to checkout when one is chosen. */}
        <button className="btn primary" disabled>Check out</button>
      </div>
    </div>
  );
}
