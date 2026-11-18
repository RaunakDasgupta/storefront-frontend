import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { money, type Channel } from "../../shared/lib/data";
import { STEPS, addressText, type Order } from "../../shared/lib/orderlogic";
import { useOrders } from "../../shared/hooks/useOrders";
import { messageOf } from "../../shared/store/errors";
import { Icon } from "../../shared/ui";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { OrderGrid } from "../components/OrderGrid";
import { H1, PAGE_HEAD, PILL_BTN, PILL_SWITCH, SEARCH_BOX, SEARCH_ICON, SEARCH_INPUT, TAB_BTN, TABS, TOOLBAR } from "../ui";
import { OrderFilterBar, useOrderFilters } from "../components/OrderFilterBar";
import { citiesOf, matchesFilters, statesOf } from "../lib/orderfilters";

const FILTERS = ["All", ...STEPS] as const;
const CHANNELS: { id: Channel; label: string }[] = [
  { id: "retail", label: "Retail orders" },
  { id: "bulk", label: "Bulk orders" },
];

/**
 * Orders placed in the storefront, with retail and bulk orders on separate tabs.
 * Admins change an order's status or delete it here, and customers see it in My orders.
 * The channel, status, search, date, value and city filters live in the URL, so the overview can link straight to a list.
 */
export function AdminOrders() {
  const { orders, setStep, remove, restore } = useOrders();
  const [params, setParams] = useSearchParams();
  const [deleting, setDeleting] = useState<Order | null>(null);
  const [undo, setUndo] = useState<{ order: Order; index: number } | null>(null);
  const [failure, setFailure] = useState("");
  /** Runs a change against the API and shows its error, if it refuses. */
  const attempt = async (change: () => Promise<void>) => { setFailure(""); try { await change(); } catch (e) { setFailure(messageOf(e)); } };
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
    const target = deleting;
    setDeleting(null);
    void attempt(async () => { const removed = await remove(target.id); if (removed) setUndo(removed); });
  }

  const { filters, filtering, today, set, clear } = useOrderFilters();

  const inChannel = orders.filter((o) => o.channel === channel);
  const needle = q.trim().toLowerCase();
  // everything except the status tab, so each tab's count is what it would show
  const matching = inChannel.filter((o) => matchesFilters(o, filters, today) && (!needle || `${o.id} ${o.customer.name} ${o.customer.email} ${o.shipping ? `${o.shipping.phone} ${addressText(o.shipping)}` : ""}`.toLowerCase().includes(needle)));
  const rows = matching.filter((o) => status === "All" || STEPS[o.step] === status);
  const count = (s: string) => matching.filter((o) => s === "All" || STEPS[o.step] === s).length;
  const states = statesOf(inChannel);
  const cities = citiesOf(inChannel, filters.state);

  return (
    <>
      <div className={PAGE_HEAD}><h1 className={H1}>Orders</h1></div>

      {undo && (
        <p className="notice mb-3" role="status">
          Deleted {undo.order.id} ({undo.order.customer.name}).{" "}
          <button className="linkbtn" onClick={() => { const { order, index } = undo; setUndo(null); void attempt(() => restore(order, index)); }}>Undo</button>
        </p>
      )}
      {failure && <p className="error" role="alert">{failure}</p>}

      <div className={PILL_SWITCH} role="group" aria-label="Order type">
        {CHANNELS.map((c) => (
          <button key={c.id} className={PILL_BTN} aria-pressed={channel === c.id} onClick={() => update({ type: c.id === "retail" ? null : c.id, status: null })}>
            {c.label} <span className="ml-1 font-medium opacity-75">{orders.filter((o) => o.channel === c.id).length}</span>
          </button>
        ))}
      </div>

      <div className={TOOLBAR}>
        <div className={TABS} role="group" aria-label="Filter by status">
          {FILTERS.map((s) => (
            <button key={s} className={TAB_BTN} aria-pressed={status === s} onClick={() => update({ status: s === "All" ? null : s })}>{s} <span className="ml-1 font-medium opacity-70">{count(s)}</span></button>
          ))}
        </div>
        <div className={SEARCH_BOX}>
          <Icon name="search" className={SEARCH_ICON} />
          <input className={SEARCH_INPUT} type="search" aria-label="Search orders" placeholder="Search order, customer or address" value={q} onChange={(e) => update({ q: e.target.value || null })} />
        </div>
      </div>
      <OrderFilterBar filters={filters} states={states} cities={cities} count={rows.length} showClear={filtering || !!q} set={set} onClear={() => clear("q")} />

      {rows.length === 0 ? <p className="text-muted">No {channel} orders match{filtering || q || status !== "All" ? " these filters" : ""}.</p> : <OrderGrid orders={rows} onStep={(id, step) => void attempt(() => setStep(id, step))} onDelete={setDeleting} />}

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
