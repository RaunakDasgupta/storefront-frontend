import { useSearchParams } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import { Icon } from "../../shared/ui";
import { ProductCard } from "../ProductCard";

const SORTS = {
  featured: "Featured",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name",
} as const;
type Sort = keyof typeof SORTS;

/** Browse page. Filters live in the URL, so a filtered view can be shared or reached from a link. */
export function Shop() {
  const { products, categories } = useCatalog();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const sale = params.get("sale") === "1";
  const sortParam = params.get("sort") ?? "featured";
  const sort: Sort = sortParam in SORTS ? (sortParam as Sort) : "featured";

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  }

  const needle = q.trim().toLowerCase();
  const shown = products
    .filter((p) => (!category || p.category === category) && (!sale || p.was) && (!needle || `${p.name} ${p.category}`.toLowerCase().includes(needle)))
    .sort((a, b) => (sort === "price-asc" ? a.price - b.price : sort === "price-desc" ? b.price - a.price : sort === "name" ? a.name.localeCompare(b.name) : 0));

  const filtered = !!(q || category || sale);

  return (
    <div className="wrap page">
      <h1>{sale ? "Sale" : category || "All products"}</h1>

      <div className="toolbar">
        <div className="search">
          <Icon name="search" />
          <input type="search" aria-label="Search products" placeholder="Search products" value={q} onChange={(e) => update({ q: e.target.value || null })} />
        </div>
        <label className="sort">
          <span>Sort</span>
          <select value={sort} onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}>
            {Object.entries(SORTS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="chips" role="group" aria-label="Filter products">
        <button className="chip" aria-pressed={!category && !sale} onClick={() => update({ category: null, sale: null })}>All</button>
        {categories.map((c) => (
          <button key={c} className="chip" aria-pressed={category === c} onClick={() => update({ category: category === c ? null : c })}>{c}</button>
        ))}
        <button className="chip" aria-pressed={sale} onClick={() => update({ sale: sale ? null : "1" })}>On sale</button>
      </div>

      <p className="muted count-line" aria-live="polite">{shown.length} {shown.length === 1 ? "product" : "products"}</p>

      {shown.length === 0 ? (
        <div className="empty">
          <h2>No products found</h2>
          <p className="muted">Try a different search or remove a filter.</p>
          {filtered && <button className="btn secondary inline" onClick={() => setParams({}, { replace: true })}>Clear filters</button>}
        </div>
      ) : (
        <div className="grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}
