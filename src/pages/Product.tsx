import { Link, useParams } from "react-router-dom";
import { byId } from "../data";
import { useCart } from "../cart";
import { Price, ProductImage } from "../components";
import { NotFound } from "./NotFound";

export function ProductPage() {
  const p = byId(useParams().id ?? "");
  const { add } = useCart();
  if (!p) return <NotFound />;

  return (
    <div className="wrap page">
      <p className="crumbs"><Link to="/">Home</Link> / {p.name}</p>
      <div className="detail">
        <ProductImage p={p} alt={p.name} eager />
        <div>
          <h1>{p.name}</h1>
          <Price p={p} />
          <p className="muted tax">Taxes included. Shipping calculated at checkout.</p>
          <p>{p.blurb}</p>
          <p className="muted">{p.stock === 0 ? "Out of stock" : p.stock < 10 ? `Only ${p.stock} left in stock` : "In stock"}</p>
          <button className="btn primary" disabled={p.stock === 0} onClick={() => add(p.id)}>
            {p.stock === 0 ? "Sold out" : "Add to cart"}
          </button>
          <details>
            <summary>Shipping and returns</summary>
            <p className="muted">Orders over ₹999 ship free. Return unused items within 30 days for a full refund.</p>
          </details>
          <details>
            <summary>Care</summary>
            <p className="muted">Follow the care label. Wash similar colors together and air dry where possible.</p>
          </details>
        </div>
      </div>
    </div>
  );
}
