import { useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import type { Channel, Product } from "../../shared/data";
import { Icon } from "../../shared/ui";
import { useMyOrders } from "../myOrders";
import { BulkBanner, CartPanel, OrderSummary, ProductCard } from "../parts";

const COPY: Record<Channel, { title: string; lede: string }> = {
  retail: { title: "Everyday essentials, ready to order", lede: "Shop individual items or choose bulk packs for your business." },
  bulk: { title: "Bulk orders", lede: "Order complete cartons or pallets for your business." },
};

const ROW_LIMIT = 5; // products shown in a section row before "See more"

const FEATURES = [
  { icon: "bag", text: "Retail packs for the home" },
  { icon: "truck", text: "Bulk cartons for business" },
  { icon: "orders", text: "Track every order" },
] as const;

/** One section of the overview: a single scrollable row of up to 5 products, then a See more tile that opens the full list. */
function Section({ title, items, to }: { title: string; items: Product[]; to: string }) {
  const track = useRef<HTMLDivElement>(null);
  const shown = items.slice(0, ROW_LIMIT);
  const more = items.length - shown.length;
  const by = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section className="row-section" aria-label={title}>
      <div className="row-head">
        <h2>{title}</h2>
        <Link to={to} className="link">See all {items.length}</Link>
      </div>
      <div className="row-wrap">
        <div className="row-track" ref={track}>
          {shown.map((p) => <div className="row-item" key={p.id}><ProductCard p={p} /></div>)}
          {more > 0 && (
            <Link to={to} className="see-more">
              <span className="see-more-icon"><Icon name="arrow" /></span>
              <strong>See more</strong>
              <span>{more} more in {title}</span>
            </Link>
          )}
        </div>
        {shown.length > 3 && (
          <>
            <button className="row-btn prev" aria-label={`Scroll ${title} left`} onClick={() => by(-1)}><Icon name="chevL" /></button>
            <button className="row-btn next" aria-label={`Scroll ${title} right`} onClick={() => by(1)}><Icon name="chevR" /></button>
          </>
        )}
      </div>
    </section>
  );
}

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

  const base = channel === "bulk" ? "/bulk" : "/";
  // no search or category picked: show one row per category; otherwise show the full filtered list
  const overview = !category && !q;

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

            {overview ? (
              categories.map((c) => (
                <Section key={c} title={c} items={inChannel.filter((p) => p.category === c)} to={`${base}?category=${encodeURIComponent(c)}`} />
              ))
            ) : shown.length === 0 ? (
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
