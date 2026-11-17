import { Link, useParams } from "react-router-dom";
import { byId, money } from "../data";
import { useCart } from "../cart";
import { ProductImage } from "../components";
import { NotFound } from "./NotFound";

export function ProductPage() {
  const p = byId(useParams().id ?? "");
  const { add } = useCart();
  if (!p) return <NotFound />;

  return (
    <div className="detail">
      <ProductImage p={p} />
      <div>
        <Link to="/" className="link">← All products</Link>
        <h1>{p.name}</h1>
        <p className="price">{money(p.price)}</p>
        <p>{p.blurb}</p>
        <p className="muted">{p.stock === 0 ? "Out of stock" : p.stock < 10 ? `Only ${p.stock} left` : "In stock"}</p>
        <button className="btn primary inline" disabled={p.stock === 0} onClick={() => add(p.id)}>
          {p.stock === 0 ? "Sold out" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}
