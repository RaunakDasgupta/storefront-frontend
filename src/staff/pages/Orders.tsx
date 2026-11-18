import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { money, type Channel } from "../../shared/lib/data";
import { STEPS, type Order } from "../../shared/lib/orderlogic";
import { useOrders } from "../../shared/hooks/useOrders";
import { Icon } from "../../shared/ui";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { OrderGrid } from "../components/OrderGrid";

const FILTERS = ["All", ...STEPS] as const;
const CHANNELS: { id: Channel; label: string }[] = [
  { id: "retail", label: "Retail orders" },
  { id: "bulk", label: "Bulk orders" },
];

/**
 * Orders placed in the storefront, with retail and bulk orders on separate tabs.
 * Staff change an order's status or delete it here, and customers see it in My orders.
 * The channel, status filter and search live in the URL, so the overview can link straight to a list.
 */
export function StaffOrders() {
  const { orders, setStep, remove, restore } = useOrders();
  const [params, setParams] = useSearchParams();
  const [deleting, setDeleting] = useState<Order | null>(null);
  const [undo, setUndo] = useState<{ order: Order; index: number } | null>(null);
  const q = params.get("q") ?? "";
  const channel: Channel = params.get("type") === "bulk" ? "bulk" : "retail";
  const statusParam = params.get("status") ?? "All";
  const status = (FILTERS as readonly string[]).includes(statusParam) ? statusParam : "All";

  // the undo notice fades away after a while
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 10000);
    return () => clearTimeout(timer);
  }, [undo]);

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  }

  function confirmDelete() {
    if (!deleting) return;
    const removed = remove(deleting.id);
    setDeleting(null);
    if (removed) setUndo(removed);
  }

  const inChannel = orders.filter((o) => o.channel === channel);
  const needle = q.trim().toLowerCase();
  const rows = inChannel.filter((o) => (status === "All" || STEPS[o.step] === status) && (!needle || `${o.id} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(needle)));
  const count = (s: string) => inChannel.filter((o) => s === "All" || STEPS[o.step] === s).length;

  return (
    <>
      <div className="page-head"><h1>Orders</h1></div>

      {undo && (
        <p className="notice" role="status">
          Deleted {undo.order.id} ({undo.order.customer.name}).{" "}
          <button className="linkbtn" onClick={() => { restore(undo.order, undo.index); setUndo(null); }}>Undo</button>
        </p>
      )}

      <div className="channel-switch" role="group" aria-label="Order type">
        {CHANNELS.map((c) => (
          <button key={c.id} aria-pressed={channel === c.id} onClick={() => update({ type: c.id === "retail" ? null : c.id, status: null })}>
            {c.label} <span>{orders.filter((o) => o.channel === c.id).length}</span>
          </button>
        ))}
      </div>

      <div className="toolbar">
        <div className="tabs" role="group" aria-label="Filter by status">
          {FILTERS.map((s) => (
            <button key={s} aria-pressed={status === s} onClick={() => update({ status: s === "All" ? null : s })}>{s} <span>{count(s)}</span></button>
          ))}
        </div>
        <div className="search">
          <Icon name="search" />
          <input type="search" aria-label="Search orders" placeholder="Search order or customer" value={q} onChange={(e) => update({ q: e.target.value || null })} />
        </div>
      </div>
      {rows.length === 0 ? <p className="muted">No {channel} orders match.</p> : <OrderGrid orders={rows} onStep={setStep} onDelete={setDeleting} />}

      {deleting && (
        <ConfirmDelete
          key={deleting.id}
          title={`Delete order ${deleting.id}?`}
          text={`${deleting.customer.name}'s ${deleting.channel} order for ${money(deleting.total)} will be removed from the portal and from their My orders page. You can undo this right after.`}
          confirmLabel="Delete order"
          onCancel={() => setDeleting(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
