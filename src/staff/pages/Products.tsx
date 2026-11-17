import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import { money } from "../../shared/data";
import { Icon, ProductImage } from "../../shared/ui";

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
      <section className="cardbox">
        {rows.length === 0 ? <p className="muted pad">No products match.</p> : (
          <div className="tablewrap">
            <table>
              <thead><tr><th>Product</th><th>SKU</th><th className="hide-sm">Category</th><th className="hide-sm">Type</th><th className="num">Price</th><th className="num">Inventory</th></tr></thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id}>
                    <td><span className="rank-name"><ProductImage p={p} className="thumb" small eager /><span>{p.name}{p.size && <span className="muted"> · {p.size}</span>}</span></span></td>
                    <td>{p.sku}</td>
                    <td className="hide-sm">{p.category}</td>
                    <td className="hide-sm"><span className={p.channel === "bulk" ? "badge paid" : "badge"}>{p.channel === "bulk" ? "Bulk" : "Retail"}</span></td>
                    <td className="num">{money(p.price)}</td>
                    <td className="num">{p.stock === 0 ? <span className="badge pending">Out of stock</span> : p.stock < 10 ? <span className="badge pending">{p.stock} left</span> : p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
