import { useSearchParams } from "react-router-dom";
import type { Channel } from "../../shared/data";
import { STEPS } from "../../shared/orderlogic";
import { useOrders } from "../../shared/orders";
import { Icon, OrdersTable } from "../../shared/ui";

const FILTERS = ["All", ...STEPS] as const;
const CHANNELS: { id: Channel; label: string }[] = [
  { id: "retail", label: "Retail orders" },
  { id: "bulk", label: "Bulk orders" },
];

/**
 * Orders placed in the storefront, with retail and bulk orders on separate tabs.
 * Staff change an order's status here and customers see it update.
 * The channel, status filter and search live in the URL, so the overview can link straight to a list.
 */
export function StaffOrders() {
  const { orders, setStep } = useOrders();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const channel: Channel = params.get("type") === "bulk" ? "bulk" : "retail";
  const statusParam = params.get("status") ?? "All";
  const status = (FILTERS as readonly string[]).includes(statusParam) ? statusParam : "All";

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  }

  const inChannel = orders.filter((o) => o.channel === channel);
  const needle = q.trim().toLowerCase();
  const rows = inChannel.filter((o) => (status === "All" || STEPS[o.step] === status) && (!needle || `${o.id} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(needle)));
  const count = (s: string) => inChannel.filter((o) => s === "All" || STEPS[o.step] === s).length;

  return (
    <>
      <div className="page-head"><h1>Orders</h1></div>

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
      <section className="cardbox">
        {rows.length === 0 ? <p className="muted pad">No {channel} orders match.</p> : <OrdersTable rows={rows} onStep={setStep} />}
      </section>
    </>
  );
}
