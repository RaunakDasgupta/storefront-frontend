import { Link, useParams } from "react-router-dom";
import { useCatalog } from "../../shared/hooks/useCatalog";
import { money } from "../../shared/lib/data";
import { ProductImage } from "../../shared/ui";
import { useCart } from "../hooks/useCart";
import { StockNote } from "../components/parts";
import { CRUMBS, H1, PAGE } from "../ui";
import { NotFound } from "./NotFound";

export function ProductPage() {
  const { byId } = useCatalog();
  const p = byId(useParams().id ?? "");
  const { add } = useCart();
  if (!p) return <NotFound />;

  const back = p.channel === "bulk" ? { to: "/bulk", label: "Bulk orders" } : { to: "/", label: "Retail" };

  return (
    <div className={PAGE}>
      <p className={CRUMBS}><Link to={back.to}>{back.label}</Link> / {p.name}</p>
      <div className="grid max-w-[960px] grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-12 max-sm:grid-cols-1 max-sm:gap-5">
        <ProductImage p={p} alt={p.name} eager className="rounded-xl" />
        <div>
          <h1 className={H1}>{p.name}</h1>
          {p.size && <p className="mt-px text-[12.5px] text-muted">{p.size}</p>}
          <p className="mt-2.5 mb-3 flex items-baseline gap-2 text-2xl font-bold">{money(p.price)}{p.was && <s className="text-[13px] font-normal text-muted">{money(p.was)}</s>}</p>
          {p.blurb && <p className="my-3.5">{p.blurb}</p>}
          <StockNote stock={p.stock} className="my-3" />
          <button className="btn btn-primary mt-2" disabled={p.stock === 0} onClick={() => add(p.id)}>{p.stock === 0 ? "Out of stock" : "Add to cart"}</button>
          <p className="mt-3 flex items-center gap-2 text-[12.5px] text-muted">Demo storefront. No payment collected.</p>
        </div>
      </div>
    </div>
  );
}
