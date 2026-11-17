import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import type { Channel, Product } from "../../shared/data";
import { Icon } from "../../shared/ui";
import { useCategories, type CategoryInfo } from "../categories";
import { CartPanel, ChannelBanner, ProductCard } from "../parts";

const COPY: Record<Channel, { title: string; lede: string }> = {
  retail: { title: "Everyday essentials, ready to order", lede: "Shop individual items or choose bulk packs for your business." },
  bulk: { title: "Bulk orders", lede: "Order complete cartons or pallets for your business." },
};

const FEATURES: Record<Channel, { icon: "bag" | "truck" | "orders"; text: string }[]> = {
  retail: [
    { icon: "bag", text: "Retail packs for the home" },
    { icon: "truck", text: "Bulk cartons for business" },
    { icon: "orders", text: "Track every order" },
  ],
  bulk: [
    { icon: "truck", text: "Cartons for shops and offices" },
    { icon: "bag", text: "Single packs in Retail" },
    { icon: "orders", text: "Track every order" },
  ],
};

const ROW_LIMIT = 5; // products shown in the Featured row before "See more"
const BROWSE_LIMIT = 8; // products shown in the category grid before "See all"

/** One scrollable row of up to 5 products, then a See more tile that opens the full list. */
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
              <span>{more} more {more === 1 ? "product" : "products"}</span>
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

/** Category tabs above one product grid. Choosing a tab swaps the products in that same grid, with no page change. */
function CategoryBrowser({ categories }: { categories: CategoryInfo[] }) {
  const [active, setActive] = useState(categories[0]?.name);
  const current = categories.find((c) => c.name === active) ?? categories[0];
  if (!current) return null;
  const items = current.products.slice(0, BROWSE_LIMIT);

  return (
    <section className="browse" aria-labelledby="browse-title">
      <div className="row-head">
        <h2 id="browse-title">Browse by category</h2>
        <Link to={current.to} className="link">See all {current.count} in {current.name}</Link>
      </div>
      <div className="browse-tabs" role="tablist" aria-label="Categories">
        {categories.map((c) => (
          <button
            key={c.name}
            id={`browse-tab-${c.name}`}
            role="tab"
            aria-selected={c.name === current.name}
            aria-controls="browse-panel"
            tabIndex={c.name === current.name ? 0 : -1}
            onClick={() => setActive(c.name)}
            onKeyDown={(e) => {
              if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
              const i = categories.indexOf(c) + (e.key === "ArrowRight" ? 1 : -1);
              const next = categories[(i + categories.length) % categories.length];
              setActive(next.name);
              document.getElementById(`browse-tab-${next.name}`)?.focus();
            }}
          >
            {c.name}<span>{c.count}</span>
          </button>
        ))}
      </div>
      <div className="grid browse-grid" id="browse-panel" role="tabpanel" aria-labelledby={`browse-tab-${current.name}`} key={current.name}>
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

/**
 * Retail (/) and Bulk orders (/bulk) share one layout:
 * intro, a banner to the other channel, Featured, a category grid you can toggle, and a See all categories button.
 * A category, a search (?q=) or See more (?view=all) shows the full list instead. Categories also live in the header dropdown.
 */
export function Shop({ channel }: { channel: Channel }) {
  const { products } = useCatalog();
  const categories = useCategories(channel);
  const [params] = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();
  const category = params.get("category") ?? "";
  const all = params.get("view") === "all";

  const inChannel = products.filter((p) => p.channel === channel);
  const shown = inChannel.filter((p) => (!category || p.category === category) && (!q || `${p.name} ${p.size ?? ""} ${p.category}`.toLowerCase().includes(q)));

  const base = channel === "bulk" ? "/bulk" : "/";
  const overview = !category && !q && !all;
  const heading = category || (q ? "Search results" : "All products");

  return (
    <>
      <section className="intro">
        <div className="wrap">
          <h1>{COPY[channel].title}</h1>
          <p className="lede">{COPY[channel].lede}</p>
          <ul className="features">
            {FEATURES[channel].map((f) => <li key={f.text}><Icon name={f.icon} />{f.text}</li>)}
          </ul>
        </div>
      </section>

      <div className="wrap page">
        <ChannelBanner channel={channel} />

        <div className="shop">
          <div className="shop-main">
            {overview ? (
              <>
                <Section title="Featured" items={inChannel} to={`${base}?view=all`} />
                <CategoryBrowser categories={categories} />
                <div className="all-cats">
                  <Link to={channel === "bulk" ? "/categories?channel=bulk" : "/categories"} className="btn secondary inline">See all {categories.length} categories</Link>
                </div>
              </>
            ) : (
              <>
                <div className="row-head list-head">
                  <h2>{heading} <span className="muted">{shown.length} {shown.length === 1 ? "product" : "products"}</span></h2>
                  <Link to={base} className="link">Back to featured</Link>
                </div>
                {shown.length === 0 ? (
                  <div className="empty">
                    <h2>No products found</h2>
                    <p className="muted">Try a different search or category.</p>
                  </div>
                ) : (
                  <div className="grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>
                )}
              </>
            )}
          </div>
          <CartPanel />
        </div>
      </div>
    </>
  );
}
