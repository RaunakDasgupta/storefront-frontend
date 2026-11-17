import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import type { Channel } from "../../shared/data";
import { Icon } from "../../shared/ui";
import { useMyOrders } from "../myOrders";
import { BulkBanner, CartPanel, OrderSummary, ProductCard } from "../parts";

const COPY: Record<Channel, { title: string; lede: string }> = {
  retail: { title: "Everyday essentials, ready to order", lede: "Shop individual items or choose bulk packs for your business." },
  bulk: { title: "Bulk orders", lede: "Order complete cartons or pallets for your business." },
};

const FEATURES = [
  { icon: "bag", text: "Retail packs for the home" },
  { icon: "truck", text: "Bulk cartons for business" },
  { icon: "orders", text: "Track every order" },
] as const;

/** Retail (/) and Bulk orders (/bulk): intro, category tabs, product grid and the cart beside it. Search comes from the header (?q=). */
export function Shop({ channel }: { channel: Channel }) {
  const { products } = useCatalog();
  const orders = useMyOrders();
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
    <>
      <section className="intro">
        <div className="wrap">
          <h1>{COPY[channel].title}</h1>
          <p className="lede">{COPY[channel].lede}</p>
          {channel === "retail" && (
            <ul className="features">
              {FEATURES.map((f) => <li key={f.text}><Icon name={f.icon} />{f.text}</li>)}
            </ul>
          )}
        </div>
      </section>

      <div className="wrap page">
        {channel === "retail" && <BulkBanner />}

        <div className="shop">
          <div className="shop-main">
            <div className="cats" role="group" aria-label="Categories">
              <button aria-pressed={!category} onClick={() => pick("")}>All products <span>{inChannel.length}</span></button>
              {categories.map((c) => <button key={c} aria-pressed={category === c} onClick={() => pick(c)}>{c} <span>{inChannel.filter((p) => p.category === c).length}</span></button>)}
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

        {channel === "retail" && orders[0] && (
          <section className="recent" aria-label="Your latest order">
            <OrderSummary o={orders[0]} />
            <Link to="/orders" className="link">Track order</Link>
          </section>
        )}
      </div>
    </>
  );
}
