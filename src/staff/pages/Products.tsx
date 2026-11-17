import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import { Icon } from "../../shared/ui";
import { ProductGrid } from "../ProductGrid";

export function StaffProducts() {
  const { products, customized, reset } = useCatalog();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const lowOnly = params.get("stock") === "low";

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  }

  const needle = q.trim().toLowerCase();
  const rows = products.filter((p) => (!lowOnly || p.stock < 10) && (!needle || `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(needle)));
  const lowCount = products.filter((p) => p.stock < 10).length;

  return (
    <>
      <div className="page-head">
        <h1>Products</h1>
        <div className="head-actions">
          {customized && (
            <button className="btn secondary inline" onClick={() => { if (window.confirm("Reset the catalog to the 28 sample products? Imported SKUs will be removed from this browser.")) reset(); }}>
              Reset catalog
            </button>
          )}
          <Link to="/staff/import" className="btn primary inline">Import SKUs</Link>
        </div>
      </div>
      <div className="toolbar">
        <div className="tabs" role="group" aria-label="Filter by stock">
          <button aria-pressed={!lowOnly} onClick={() => update({ stock: null })}>All <span>{products.length}</span></button>
          <button aria-pressed={lowOnly} onClick={() => update({ stock: "low" })}>Low stock <span>{lowCount}</span></button>
        </div>
        <div className="search">
          <Icon name="search" />
          <input type="search" aria-label="Search products" placeholder="Search name or SKU" value={q} onChange={(e) => update({ q: e.target.value || null })} />
        </div>
      </div>
      {rows.length === 0 ? <p className="muted">No products match.</p> : <ProductGrid products={rows} />}
    </>
  );
}
