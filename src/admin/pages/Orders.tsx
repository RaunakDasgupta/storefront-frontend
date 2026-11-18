import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { money, type Channel } from "../../shared/lib/data";
import { STEPS, addressText, type Order } from "../../shared/lib/orderlogic";
import { useOrders } from "../../shared/hooks/useOrders";
import { messageOf } from "../../shared/store/errors";
import { Icon } from "../../shared/ui";
import { ConfirmDelete } from "../components/ConfirmDelete";
import { OrderGrid } from "../components/OrderGrid";
import { DATE_PRESETS, VALUE_BANDS, citiesOf, isFiltering, matchesFilters, type DatePreset, type OrderFilters, type ValueBand } from "../lib/orderfilters";

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

  const dateParam = params.get("date");
  const valueParam = params.get("value");
  const filters: OrderFilters = {
    date: DATE_PRESETS.some((d) => d.id === dateParam) ? (dateParam as DatePreset) : "all",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    value: VALUE_BANDS.some((b) => b.id === valueParam) ? (valueParam as ValueBand) : "all",
    city: params.get("city") ?? "",
  };
  const today = new Date().toISOString().slice(0, 10);

  const inChannel = orders.filter((o) => o.channel === channel);
  const needle = q.trim().toLowerCase();
  // everything except the status tab, so each tab's count is what it would show
  const matching = inChannel.filter((o) => matchesFilters(o, filters, today) && (!needle || `${o.id} ${o.customer.name} ${o.customer.email} ${o.shipping ? `${o.shipping.phone} ${addressText(o.shipping)}` : ""}`.toLowerCase().includes(needle)));
  const rows = matching.filter((o) => status === "All" || STEPS[o.step] === status);
  const count = (s: string) => matching.filter((o) => s === "All" || STEPS[o.step] === s).length;
  const cities = citiesOf(inChannel);
  const filtering = isFiltering(filters);

  return (
    <>
      <div className="page-head"><h1>Orders</h1></div>

      {undo && (
        <p className="notice" role="status">
          Deleted {undo.order.id} ({undo.order.customer.name}).{" "}
          <button className="linkbtn" onClick={() => { const { order, index } = undo; setUndo(null); void attempt(() => restore(order, index)); }}>Undo</button>
        </p>
      )}
      {failure && <p className="error" role="alert">{failure}</p>}

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
          <input type="search" aria-label="Search orders" placeholder="Search order, customer or address" value={q} onChange={(e) => update({ q: e.target.value || null })} />
        </div>
      </div>
      <div className="filterbar" role="group" aria-label="Filter orders">
        <div className="field">
          <label htmlFor="of-date">Placed</label>
          <select id="of-date" value={filters.date} onChange={(e) => update({ date: e.target.value === "all" ? null : e.target.value, ...(e.target.value === "custom" ? {} : { from: null, to: null }) })}>
            {DATE_PRESETS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
          </select>
        </div>
        {filters.date === "custom" && (
          <>
            <div className="field">
              <label htmlFor="of-from">From</label>
              <input id="of-from" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => update({ from: e.target.value || null })} />
            </div>
            <div className="field">
              <label htmlFor="of-to">To</label>
              <input id="of-to" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => update({ to: e.target.value || null })} />
            </div>
          </>
        )}
        <div className="field">
          <label htmlFor="of-value">Order value</label>
          <select id="of-value" value={filters.value} onChange={(e) => update({ value: e.target.value === "all" ? null : e.target.value })}>
            {VALUE_BANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="of-city">Delivery city</label>
          <select id="of-city" value={filters.city} onChange={(e) => update({ city: e.target.value || null })}>
            <option value="">Any city</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
            {filters.city && !cities.includes(filters.city) && <option value={filters.city}>{filters.city}</option>}
          </select>
        </div>
        {(filtering || q) && (
          <button type="button" className="linkbtn filter-clear" onClick={() => update({ date: null, from: null, to: null, value: null, city: null, q: null })}>Clear filters</button>
        )}
        <p className="muted filter-count" aria-live="polite">{rows.length} {rows.length === 1 ? "order" : "orders"}</p>
      </div>

      {rows.length === 0 ? <p className="muted">No {channel} orders match{filtering || q || status !== "All" ? " these filters" : ""}.</p> : <OrderGrid orders={rows} onStep={(id, step) => void attempt(() => setStep(id, step))} onDelete={setDeleting} />}

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
