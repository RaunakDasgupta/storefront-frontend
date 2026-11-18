import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "../../shared/hooks/useCatalog";
import type { Channel, Product } from "../../shared/lib/data";
import { Icon } from "../../shared/ui";
import { useCategories, type CategoryInfo } from "../hooks/useCategories";
import { CartPanel, ChannelBanner, ProductCard } from "../components/parts";
import { EMPTY, PAGE, PRODUCT_GRID, ROW_BTN, ROW_HEAD, ROW_TITLE, WRAP } from "../ui";

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
    <section className="mb-6" aria-label={title}>
      <div className={ROW_HEAD}>
        <h2 className={ROW_TITLE}>{title}</h2>
        <Link to={to} className="link">See all {items.length}</Link>
      </div>
      <div className="relative">
        <div className="-mx-1 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-1 pt-1 pb-3.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" ref={track}>
          {shown.map((p) => <div className="flex-[0_0_188px] snap-start max-sm:min-w-[150px] max-sm:basis-[calc(50%-8px)]" key={p.id}><ProductCard p={p} /></div>)}
          {more > 0 && (
            <Link to={to} className="flex flex-[0_0_150px] snap-start flex-col items-center justify-center gap-1.5 rounded-2xl border-[1.5px] border-dashed border-brand-line bg-brand-tint p-4 text-center text-forest no-underline transition duration-200 hover:-translate-y-0.5 hover:border-brand hover:bg-brand-line max-sm:basis-[130px]">
              <span className="grid size-11 place-items-center rounded-full bg-brand text-white"><Icon name="arrow" /></span>
              <strong className="text-base">See more</strong>
              <span className="text-[12.5px] text-muted">{more} more {more === 1 ? "product" : "products"}</span>
            </Link>
          )}
        </div>
        {shown.length > 3 && (
          <>
            <button className={`${ROW_BTN} top-24 -left-3.5`} aria-label={`Scroll ${title} left`} onClick={() => by(-1)}><Icon name="chevL" className="size-5" /></button>
            <button className={`${ROW_BTN} top-24 -right-3.5`} aria-label={`Scroll ${title} right`} onClick={() => by(1)}><Icon name="chevR" className="size-5" /></button>
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
    <section className="mb-2" aria-labelledby="browse-title">
      <div className={ROW_HEAD}>
        <h2 id="browse-title" className={ROW_TITLE}>Browse by category</h2>
        <Link to={current.to} className="link">See all {current.count} in {current.name}</Link>
      </div>
      <div className="-mx-1 mb-[18px] flex gap-2 overflow-x-auto px-1 pt-0.5 pb-1.5 [scrollbar-width:none]" role="tablist" aria-label="Categories">
        {categories.map((c) => (
          <button
            key={c.name}
            id={`browse-tab-${c.name}`}
            role="tab"
            className="group inline-flex flex-none items-center gap-1.5 rounded-full border border-line bg-surface px-4 py-2 font-semibold text-ink transition duration-200 hover:border-brand aria-selected:border-brand aria-selected:bg-brand aria-selected:text-white"
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
            {c.name}<span className="text-xs font-medium text-muted group-aria-selected:text-white/85">{c.count}</span>
          </button>
        ))}
      </div>
      <div className={`${PRODUCT_GRID} min-h-[340px] animate-browse-in content-start`} id="browse-panel" role="tabpanel" aria-labelledby={`browse-tab-${current.name}`} key={current.name}>
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
      <section className="border-b border-brand-line bg-gradient-to-b from-brand-tint to-surface pt-10 pb-9 max-sm:pt-7 max-sm:pb-6">
        <div className={WRAP}>
          <h1 className="mb-2 text-[clamp(30px,4vw,42px)] leading-[1.15] font-[750] tracking-[-0.025em]">{COPY[channel].title}</h1>
          <p className="max-w-[560px] text-[17px] text-muted">{COPY[channel].lede}</p>
          <ul className="mt-[22px] flex flex-wrap gap-2.5">
            {FEATURES[channel].map((f) => (
              <li key={f.text} className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-surface py-[7px] pr-3.5 pl-2.5 text-[13.5px] font-[550] shadow-[0_1px_2px_rgba(0,0,0,.04)] max-sm:py-1.5 max-sm:pr-3 max-sm:pl-2 max-sm:text-[12.5px]">
                <Icon name={f.icon} className="size-[18px] text-brand" />{f.text}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className={PAGE}>
        <ChannelBanner channel={channel} />

        <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-9 max-[1000px]:grid-cols-1 max-[1000px]:gap-8">
          <div>
            {overview && inChannel.length === 0 ? (
              <div className={EMPTY}>
                <h2 className="text-[22px]">No {channel} products yet</h2>
                <p className="text-muted">Check back soon.</p>
              </div>
            ) : overview ? (
              <>
                <Section title="Featured" items={inChannel} to={`${base}?view=all`} />
                <CategoryBrowser categories={categories} />
                <div className="mt-1 mb-2 flex justify-center">
                  <Link to={channel === "bulk" ? "/categories?channel=bulk" : "/categories"} className="btn btn-secondary btn-inline">See all {categories.length} categories</Link>
                </div>
              </>
            ) : (
              <>
                <div className={ROW_HEAD}>
                  <h2 className={`${ROW_TITLE} flex items-baseline gap-2.5`}>{heading} <span className="text-[13px] font-medium text-muted">{shown.length} {shown.length === 1 ? "product" : "products"}</span></h2>
                  <Link to={base} className="link">Back to featured</Link>
                </div>
                {shown.length === 0 ? (
                  <div className={EMPTY}>
                    <h2 className="text-[22px]">No products found</h2>
                    <p className="text-muted">Try a different search or category.</p>
                  </div>
                ) : (
                  <div className={PRODUCT_GRID}>{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>
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
