import { useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import type { Channel, Product } from "../../shared/data";
import { Icon } from "../../shared/ui";
import { useCategories } from "../categories";
import { BulkBanner, CartPanel, ProductCard } from "../parts";

const COPY: Record<Channel, { title: string; lede: string }> = {
  retail: { title: "Everyday essentials, ready to order", lede: "Shop individual items or choose bulk packs for your business." },
  bulk: { title: "Bulk orders", lede: "Order complete cartons or pallets for your business." },
};

const ROW_LIMIT = 5; // products shown in a section row before "See more"
const CATEGORY_ROWS = 2; // category sections shown on the landing page after Featured

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

/**
 * Retail (/) and Bulk orders (/bulk).
 * Landing: a Featured row, then (Retail only) two category rows and a See all categories button.
 * A category, a search (?q=) or See more (?view=all) shows the full list instead. Categories themselves live in the header dropdown.
 */
export function Shop({ channel }: { channel: Channel }) {
  const { products } = useCatalog();
  const categories = useCategories();
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
            {overview ? (
              <>
                <Section title="Featured" items={inChannel} to={`${base}?view=all`} />
                {channel === "retail" && (
                  <>
                    {categories.slice(0, CATEGORY_ROWS).map((c) => <Section key={c.name} title={c.name} items={c.products} to={c.to} />)}
                    <div className="all-cats">
                      <Link to="/categories" className="btn secondary inline">See all {categories.length} categories</Link>
                    </div>
                  </>
                )}
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
