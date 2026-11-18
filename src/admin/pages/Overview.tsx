import { Link } from "react-router-dom";
import { useCatalog } from "../../shared/hooks/useCatalog";
import { useOrders } from "../../shared/hooks/useOrders";
import { OrderFilterBar, useOrderFilters } from "../components/OrderFilterBar";
import { citiesOf, matchesFilters, statesOf } from "../lib/orderfilters";
import { fmtDate, money } from "../../shared/lib/data";
import { STEPS, countByStep, revenueByDay, revenueOf } from "../../shared/lib/orderlogic";
import { STEP_BADGE } from "../../shared/ui";
import { RevenueChart, StatusBars } from "../components/Charts";
import { CARD, CARD_BODY, CARD_HEAD, CARD_TITLE, H1, PAGE_HEAD } from "../ui";

const LOW_STOCK = 10;

/** The dashboard: headline numbers, revenue and fulfilment charts, the newest orders and what is running low. */
export function Overview() {
  const { orders: allOrders } = useOrders();
  const { filters, status, filtering, today, set, clear } = useOrderFilters();
  // the numbers, charts and recent orders below follow the filters; low stock is about products, so it does not
  const matching = allOrders.filter((o) => matchesFilters(o, filters, today));
  const orders = matching.filter((o) => !status || STEPS[o.step] === status);
  const filteringAny = filtering || !!status;
  const { products } = useCatalog();

  const retail = orders.filter((o) => o.channel === "retail"), bulk = orders.filter((o) => o.channel === "bulk");
  // the status bars show every status for the other filters, with the chosen one marked, so you can see what you are narrowing
  const counts = countByStep(matching);
  const open = orders.filter((o) => o.step < 3).length;
  const low = products.filter((p) => p.stock < LOW_STOCK).sort((a, b) => a.stock - b.stock);
  const emptyText = filteringAny ? "No orders match these filters." : "No orders yet.";
  const kpis = [
    { label: "Revenue", value: money(revenueOf(orders)), sub: `Retail ${money(revenueOf(retail))} · Bulk ${money(revenueOf(bulk))}` },
    { label: "Orders", value: String(orders.length), sub: `Retail ${retail.length} · Bulk ${bulk.length}` },
    { label: "Average order", value: money(orders.length ? Math.round(revenueOf(orders) / orders.length) : 0), sub: "Revenue per order" },
    { label: "To fulfil", value: String(open), sub: open === 1 ? "Order not yet ready for dispatch" : "Orders not yet ready for dispatch" },
  ];

  return (
    <>
      <div className={PAGE_HEAD}>
        <div>
          <h1 className={H1}>Overview</h1>
          <p className="mt-1 text-muted">How the store is doing. Orders placed in the storefront show up here straight away.</p>
        </div>
      </div>

      <OrderFilterBar filters={filters} states={statesOf(allOrders)} cities={citiesOf(allOrders, filters.state)} count={orders.length} statuses={STEPS} status={status} showClear={filteringAny} set={set} onClear={() => clear("status")} />

      <div className="mb-4 grid grid-cols-4 gap-4 max-[1100px]:grid-cols-2 max-sm:gap-2.5">
        {kpis.map((k) => (
          <section key={k.label} className={`${CARD} px-[18px] py-4`} aria-label={k.label}>
            <h2 className="mb-1.5 text-[13px] font-semibold text-muted">{k.label}</h2>
            <strong className="block text-[28px] leading-[1.2] font-[750] tracking-[-0.02em] max-sm:text-[22px]">{k.value}</strong>
            <p className="mt-1 text-[12.5px] text-muted">{k.sub}</p>
          </section>
        ))}
      </div>

      <div className="mb-4 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 max-[1100px]:grid-cols-1">
        <section className={CARD} aria-label="Revenue by day">
          <header className={CARD_HEAD}><h2 className={CARD_TITLE}>Revenue by day</h2><span className="text-muted">7 days up to the latest order</span></header>
          <div className={CARD_BODY}>{orders.length ? <RevenueChart days={revenueByDay(orders)} /> : <p className="text-muted">{emptyText}</p>}</div>
        </section>
        <section className={CARD} aria-label="Orders by status">
          <header className={CARD_HEAD}><h2 className={CARD_TITLE}>Orders by status</h2><Link to="/admin/orders" className="link">Manage</Link></header>
          <div className={CARD_BODY}><StatusBars counts={counts} selected={status} onSelect={(s) => set({ status: s })} /></div>
        </section>
      </div>

      <div className="mb-4 grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-4 max-[1100px]:grid-cols-1">
        <section className={CARD} aria-label="Recent orders">
          <header className={CARD_HEAD}><h2 className={CARD_TITLE}>Recent orders</h2><Link to="/admin/orders" className="link">View all orders</Link></header>
          {orders.length === 0 ? <div className={CARD_BODY}><p className="text-muted">{emptyText}</p></div> : (
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Order</th><th>Customer</th><th className="max-sm:hidden">Type</th><th className="max-sm:hidden">Delivers to</th><th>Status</th><th className="text-right">Total</th></tr></thead>
                <tbody>
                  {orders.slice(0, 8).map((o) => (
                    <tr key={o.id}>
                      <td><Link to={`/admin/orders?type=${o.channel}&q=${o.id}`} className="link"><strong>{o.id}</strong></Link><span className="text-muted"> {fmtDate(o.date)}</span></td>
                      <td>{o.customer.name}</td>
                      <td className="max-sm:hidden">{o.channel === "bulk" ? "Bulk" : "Retail"}</td>
                      <td className="max-sm:hidden">{o.shipping ? `${o.shipping.city}, ${o.shipping.state}` : <span className="text-muted">No address</span>}</td>
                      <td><span className={`badge ${STEP_BADGE[o.step]}`}>{STEPS[o.step]}</span></td>
                      <td className="text-right">{money(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className={CARD} aria-label="Low stock">
          <header className={CARD_HEAD}><h2 className={CARD_TITLE}>Low stock</h2><Link to="/admin/products?stock=low" className="link">View all {low.length}</Link></header>
          <div className={CARD_BODY}>
            {low.length === 0 ? <p className="text-muted">Every product has {LOW_STOCK} or more in stock.</p> : (
              <ul className="mt-2">
                {low.slice(0, 6).map((p) => <li key={p.id} className="flex justify-between gap-3 border-t border-line py-[9px] first:border-t-0"><span>{p.name}{p.size && <span className="text-muted"> · {p.size}</span>}</span><strong className={p.stock === 0 ? "text-danger" : undefined}>{p.stock === 0 ? "Out" : `${p.stock} left`}</strong></li>)}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
