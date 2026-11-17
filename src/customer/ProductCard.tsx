import { Link } from "react-router-dom";
import type { Product } from "../shared/data";
import { Price, ProductImage } from "../shared/ui";
import { useCart } from "./cart";

export function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  const soldOut = p.stock === 0;
  return (
    <article className="pcard">
      <div className="media">
        <Link to={`/products/${p.id}`} tabIndex={-1}><ProductImage p={p} /></Link>
        {soldOut ? <span className="tag dark">Sold out</span> : p.was && <span className="tag">Sale</span>}
        {!soldOut && <button className="btn light quick" onClick={() => add(p.id)}>Quick add</button>}
      </div>
      <Link to={`/products/${p.id}`} className="pname">{p.name}</Link>
      <Price p={p} />
    </article>
  );
}
