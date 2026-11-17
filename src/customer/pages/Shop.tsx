import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import type { Channel } from "../../shared/data";
import { CartPanel, OrderSummary, ProductCard } from "../parts";
import { useOrders } from "../orders";

const COPY: Record<Channel, { title: string; lede: string }> = {
  retail: { title: "Everyday essentials, ready to order", lede: "Shop individual items or choose bulk packs for your business." },
  bulk: { title: "Bulk orders", lede: "Order complete cartons or pallets for your business." },
};

/** Retail (/) and Bulk orders (/bulk): category tabs, product grid and the cart beside it. Search comes from the header (?q=). */
export function Shop({ channel }: { channel: Channel }) {
  const { products } = useCatalog();
  const { orders } = useOrders();
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const category = params.get("category") ?? "";

  const inChannel = products.filter((p) => p.channel === channel);
  const categories = [...new Set(inChannel.map((p) => p.category))];
  const shown = inChannel.filter((p) => (!category || p.category === category) && (!q || `${p.name} ${p.size ?? ""} ${p.category}`.toLowerCase().includes(q)));

  function pick(c: string) {
    const next = new URLSearchParams(params);
    c ? next.set("category", c) : next.delete("category");
    setParams(next, { replace: true });
  }

  return (
    <div className="wrap page">
      <div className="shop">
        <div className="shop-main">
          <h1>{COPY[channel].title}</h1>
          <p className="lede">{COPY[channel].lede}</p>

          <div className="cats" role="group" aria-label="Categories">
            <button aria-pressed={!category} onClick={() => pick("")}>All products</button>
            {categories.map((c) => <button key={c} aria-pressed={category === c} onClick={() => pick(c)}>{c}</button>)}
          </div>

          {shown.length === 0 ? (
            <div className="empty">
              <h2>No products found</h2>
              <p className="muted">Try a different search or category.</p>
            </div>
          ) : (
            <div className="grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          )}
        </div>
        <CartPanel />
      </div>

      {channel === "retail" && (
        <>
          <section className="bulk-banner">
            <img className="pimg" src="/products/bulk-cartons.jpg" alt="" width={1000} height={420} loading="lazy" />
            <div>
              <h2>Buying in bulk?</h2>
              <p>Order complete cartons or pallets.</p>
            </div>
            <Link to="/bulk" className="btn primary inline">Browse bulk packs</Link>
          </section>

          {orders[0] && (
            <section className="recent" aria-label="Recent order">
              <OrderSummary o={orders[0]} />
              <Link to="/orders" className="link">View all orders</Link>
            </section>
          )}
        </>
      )}
    </div>
  );
}
