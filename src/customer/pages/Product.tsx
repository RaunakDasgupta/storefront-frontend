import { Link, useParams } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import { money } from "../../shared/data";
import { ProductImage } from "../../shared/ui";
import { useCart } from "../cart";
import { StockNote } from "../parts";
import { NotFound } from "./NotFound";

export function ProductPage() {
  const { byId } = useCatalog();
  const p = byId(useParams().id ?? "");
  const { add } = useCart();
  if (!p) return <NotFound />;

  const back = p.channel === "bulk" ? { to: "/bulk", label: "Bulk orders" } : { to: "/", label: "Retail" };

  return (
    <div className="wrap page">
      <p className="crumbs"><Link to={back.to}>{back.label}</Link> / {p.name}</p>
      <div className="detail">
        <ProductImage p={p} alt={p.name} eager />
        <div>
          <h1>{p.name}</h1>
          {p.size && <p className="size">{p.size}</p>}
          <p className="price big">{money(p.price)}{p.was && <s>{money(p.was)}</s>}</p>
          {p.blurb && <p>{p.blurb}</p>}
          <StockNote stock={p.stock} />
          <button className="btn primary" disabled={p.stock === 0} onClick={() => add(p.id)}>{p.stock === 0 ? "Out of stock" : "Add to cart"}</button>
          <p className="demo-note">Demo storefront. No payment collected.</p>
        </div>
      </div>
    </div>
  );
}
