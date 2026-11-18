import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ImportPanel } from "../components/ImportPanel";
import { useCatalog } from "../../shared/hooks/useCatalog";
import type { Channel, Product } from "../../shared/lib/data";
import { messageOf } from "../../shared/store/errors";
import { Icon } from "../../shared/ui";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { ProductEditor } from "../components/ProductEditor";
import { ProductGrid } from "../components/ProductGrid";
import { H1, PAGE_HEAD, PILL_BTN, PILL_SWITCH, SEARCH_BOX, SEARCH_ICON, SEARCH_INPUT, TAB_BTN, TABS, TOOLBAR } from "../ui";

const CHANNELS: { id: Channel; label: string }[] = [
  { id: "retail", label: "Retail products" },
  { id: "bulk", label: "Bulk products" },
];

/**
 * Product management: the catalog as editable, deletable cards (Retail and Bulk on separate tabs, a low-stock filter and
 * search), a button to add a product, and an Import tab (`?tab=import`) for CSV files, databases and cloud services.
 */
export function AdminProducts() {
  const { products, canReset, reset, remove, restore } = useCatalog();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [undo, setUndo] = useState<{ product: Product; index: number } | null>(null);
  const [failure, setFailure] = useState("");
  /** Runs a change against the API and shows its error, if it refuses. */
  const attempt = async (change: () => Promise<void>) => { setFailure(""); try { await change(); } catch (e) { setFailure(messageOf(e)); } };

  // the undo notice fades away after a while
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 10000);
    return () => clearTimeout(timer);
  }, [undo]);

  function confirmDelete() {
    if (!deleting) return;
    const target = deleting;
    setDeleting(null);
    void attempt(async () => { const removed = await remove(target.id); if (removed) setUndo(removed); });
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
  const importing = params.get("tab") === "import";

  return (
    <>
      <div className={PAGE_HEAD}>
        <div>
          <h1 className={H1}>Product management</h1>
          <p className="mt-1 text-muted">Add, edit, delete and import the products in your store.</p>
        </div>
        <div className="flex flex-wrap gap-2 max-sm:w-full max-sm:[&_.btn]:flex-1">
          {canReset && (
            <button className="btn btn-secondary btn-inline px-[18px] py-[9px]" onClick={() => { if (window.confirm("Reset the catalog to the sample products? Imported and edited products will be removed from this browser.")) void attempt(reset); }}>
              Reset catalog
            </button>
          )}
          <button className="btn btn-primary btn-inline px-[18px] py-[9px]" onClick={() => { update({ tab: null }); setEditing("new"); }}>Add product</button>
        </div>
      </div>
      <div className="mb-5 border-b border-line">
        <div className={TABS} role="group" aria-label="Product management">
          <button className={TAB_BTN} aria-pressed={!importing} onClick={() => update({ tab: null })}>Products <span className="ml-1 font-medium opacity-70">{products.length}</span></button>
          <button className={TAB_BTN} aria-pressed={importing} onClick={() => update({ tab: "import" })}>Import</button>
        </div>
      </div>

      {importing ? <ImportPanel /> : (
        <>
        {undo && (
          <p className="notice mb-3" role="status">
            Deleted {undo.product.name} ({undo.product.sku}).{" "}
            <button className="linkbtn" onClick={() => { const { product, index } = undo; setUndo(null); void attempt(() => restore(product, index)); }}>Undo</button>
          </p>
        )}
        {failure && <p className="error" role="alert">{failure}</p>}

        <div className={PILL_SWITCH} role="group" aria-label="Product type">
          {CHANNELS.map((c) => (
            <button key={c.id} className={PILL_BTN} aria-pressed={channel === c.id} onClick={() => update({ type: c.id === "retail" ? null : c.id })}>
              {c.label} <span className="ml-1 font-medium opacity-75">{products.filter((p) => p.channel === c.id).length}</span>
            </button>
          ))}
        </div>

        <div className={TOOLBAR}>
          <div className={TABS} role="group" aria-label="Filter by stock">
            <button className={TAB_BTN} aria-pressed={!lowOnly} onClick={() => update({ stock: null })}>All <span className="ml-1 font-medium opacity-70">{inChannel.length}</span></button>
            <button className={TAB_BTN} aria-pressed={lowOnly} onClick={() => update({ stock: "low" })}>Low stock <span className="ml-1 font-medium opacity-70">{lowCount}</span></button>
          </div>
          <div className={SEARCH_BOX}>
            <Icon name="search" className={SEARCH_ICON} />
            <input className={SEARCH_INPUT} type="search" aria-label="Search products" placeholder="Search name or SKU" value={q} onChange={(e) => update({ q: e.target.value || null })} />
          </div>
        </div>
        {rows.length === 0 ? <p className="text-muted">No {channel} products match.</p> : <ProductGrid products={rows} onEdit={setEditing} onDelete={setDeleting} />}
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
        </>
      )}
      {editing && <ProductEditor key={editing === "new" ? "new" : editing.id} product={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />}
    </>
  );
}
