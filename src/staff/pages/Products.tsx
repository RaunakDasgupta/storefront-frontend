import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCatalog } from "../../shared/hooks/useCatalog";
import type { Channel, Product } from "../../shared/lib/data";
import { Icon } from "../../shared/ui";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { ProductEditor } from "../components/ProductEditor";
import { ProductGrid } from "../components/ProductGrid";

const CHANNELS: { id: Channel; label: string }[] = [
  { id: "retail", label: "Retail products" },
  { id: "bulk", label: "Bulk products" },
];

/** Products as editable, deletable cards, with Retail and Bulk on separate tabs (`?type=bulk`), a low-stock filter and search. */
export function StaffProducts() {
  const { products, customized, reset, remove, restore } = useCatalog();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [undo, setUndo] = useState<{ product: Product; index: number } | null>(null);

  // the undo notice fades away after a while
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 10000);
    return () => clearTimeout(timer);
  }, [undo]);

  function confirmDelete() {
    if (!deleting) return;
    const removed = remove(deleting.id);
    setDeleting(null);
    if (removed) setUndo(removed);
  }
  const q = params.get("q") ?? "";
  const lowOnly = params.get("stock") === "low";
  const channel: Channel = params.get("type") === "bulk" ? "bulk" : "retail";

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  }

  const needle = q.trim().toLowerCase();
  const inChannel = products.filter((p) => p.channel === channel);
  const rows = inChannel.filter((p) => (!lowOnly || p.stock < 10) && (!needle || `${p.name} ${p.sku} ${p.category}`.toLowerCase().includes(needle)));
  const lowCount = inChannel.filter((p) => p.stock < 10).length;

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
      {undo && (
        <p className="notice" role="status">
          Deleted {undo.product.name} ({undo.product.sku}).{" "}
          <button className="linkbtn" onClick={() => { restore(undo.product, undo.index); setUndo(null); }}>Undo</button>
        </p>
      )}

      <div className="channel-switch" role="group" aria-label="Product type">
        {CHANNELS.map((c) => (
          <button key={c.id} aria-pressed={channel === c.id} onClick={() => update({ type: c.id === "retail" ? null : c.id })}>
            {c.label} <span>{products.filter((p) => p.channel === c.id).length}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="tabs" role="group" aria-label="Filter by stock">
          <button aria-pressed={!lowOnly} onClick={() => update({ stock: null })}>All <span>{inChannel.length}</span></button>
          <button aria-pressed={lowOnly} onClick={() => update({ stock: "low" })}>Low stock <span>{lowCount}</span></button>
        </div>
        <div className="search">
          <Icon name="search" />
          <input type="search" aria-label="Search products" placeholder="Search name or SKU" value={q} onChange={(e) => update({ q: e.target.value || null })} />
        </div>
      </div>
      {rows.length === 0 ? <p className="muted">No {channel} products match.</p> : <ProductGrid products={rows} onEdit={setEditing} onDelete={setDeleting} />}
      {deleting && (
        <ConfirmDelete
          key={deleting.id}
          title={`Delete ${deleting.name}?`}
          text={`${deleting.sku}${deleting.size ? ` · ${deleting.size}` : ""} will be removed from the ${deleting.channel} storefront. Orders that already include it keep their items. You can undo this right after.`}
          confirmLabel="Delete product"
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
      {editing && <ProductEditor key={editing.id} product={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
