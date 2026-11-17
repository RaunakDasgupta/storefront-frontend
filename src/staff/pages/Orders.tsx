import { useSearchParams } from "react-router-dom";
import { STEPS } from "../../shared/orderlogic";
import { useOrders } from "../../shared/orders";
import { Icon, OrdersTable } from "../../shared/ui";

const FILTERS = ["All", ...STEPS] as const;

/** Every order placed in the storefront. Staff change an order's status here and customers see it update. The status filter and search live in the URL, so the overview can link straight to "Confirmed". */
export function StaffOrders() {
  const { orders, setStep } = useOrders();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const statusParam = params.get("status") ?? "All";
  const status = (FILTERS as readonly string[]).includes(statusParam) ? statusParam : "All";

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k);
    setParams(next, { replace: true });
  }

  const needle = q.trim().toLowerCase();
  const rows = orders.filter((o) => (status === "All" || STEPS[o.step] === status) && (!needle || `${o.id} ${o.customer.name} ${o.customer.email}`.toLowerCase().includes(needle)));
  const count = (s: string) => orders.filter((o) => s === "All" || STEPS[o.step] === s).length;

  return (
    <>
      <div className="page-head"><h1>Orders</h1></div>
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
        {rows.length === 0 ? <p className="muted pad">No orders match.</p> : <OrdersTable rows={rows} onStep={setStep} />}
      </section>
    </>
  );
}
