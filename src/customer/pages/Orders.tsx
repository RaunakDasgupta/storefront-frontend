import { useState } from "react";
import { Link } from "react-router-dom";
import { useCatalog } from "../../shared/hooks/useCatalog";
import { money } from "../../shared/lib/data";
import { STEPS, STEP_MESSAGE, addressText, itemCount, type Order } from "../../shared/lib/orderlogic";
import { useLoadOrders } from "../../shared/hooks/useOrders";
import { Icon, LoadGate, ProductImage, STEP_BADGE } from "../../shared/ui";
import { useCart } from "../hooks/useCart";
import { useMyOrders } from "../hooks/useMyOrders";
import { Tracker } from "../components/parts";
import { useToast } from "../components/Toast";
import { H1, PAGE_NARROW } from "../ui";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "retail", label: "Retail" },
  { id: "bulk", label: "Bulk" },
] as const;

const when = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

function OrderCard({ o }: { o: Order }) {
  const { byId } = useCatalog();
  const { add } = useCart();
  const toast = useToast();
  const products = o.items.flatMap((i) => { const p = byId(i.id); return p ? [p] : []; });
  const photos = products.slice(0, 4);
  const extra = o.items.length - photos.length;

  function orderAgain() {
    const available = o.items.filter((i) => (byId(i.id)?.stock ?? 0) > 0);
    available.forEach((i) => add(i.id, i.qty));
    toast.show(available.length
      ? { message: `${available.length} ${available.length === 1 ? "item" : "items"} from ${o.id} added to your cart`, actionLabel: "View cart", to: "/cart" }
      : { message: "Those items are out of stock right now" });
  }

  return (
    <article className="rounded-[18px] border border-line bg-surface p-[22px] shadow-[0_4px_18px_rgba(0,0,0,.05)] transition-shadow hover:shadow-[0_10px_28px_rgba(0,0,0,.09)] max-sm:p-4">
      <header className="flex flex-wrap items-start justify-between gap-x-5 gap-y-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h2 className="text-xl font-[750] tracking-[-0.01em]">{o.id}</h2>
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-[650] ${o.channel === "bulk" ? "border-[#c6dcff] bg-[#e8f1ff] text-[#123f7a] dark:border-[#2c4a78] dark:bg-[#15263f] dark:text-[#a8c8f5]" : "border-brand-line bg-brand-tint text-forest"}`}>{o.channel === "bulk" ? "Bulk" : "Retail"}</span>
          <span className="basis-full text-[13px] text-muted">Placed {when(o.date)} · {itemCount(o)} {itemCount(o) === 1 ? "item" : "items"}</span>
        </div>
        <div className="flex flex-col items-end gap-1.5 max-sm:flex-row max-sm:items-center max-sm:gap-2.5">
          <span className={`badge ${STEP_BADGE[o.step]}`}>{STEPS[o.step]}</span>
          <strong className="text-[22px] tracking-[-0.02em] max-sm:text-xl">{money(o.total)}</strong>
        </div>
      </header>

      <div className="my-[18px] flex items-center gap-3.5">
        <div className="flex shrink-0" aria-hidden="true">
          {photos.map((p) => <ProductImage key={p.id} p={p} small className="-ml-2.5 size-[52px] rounded-xl border-2 border-surface shadow-[0_0_0_1px_var(--color-line)] first:ml-0" />)}
          {extra > 0 && <span className="-ml-2.5 grid size-[52px] place-items-center rounded-xl border-2 border-surface bg-soft text-[13px] font-[650] shadow-[0_0_0_1px_var(--color-line)]">+{extra}</span>}
        </div>
        <p className="line-clamp-2 text-muted">{o.items.map((i) => i.name).join(", ")}</p>
      </div>

      {o.shipping && (
        <p className="-mt-1.5 mb-4 flex items-start gap-2 text-[13.5px] text-muted">
          <Icon name="truck" className="mt-px size-[18px] shrink-0" />
          <span>Delivering to <strong className="font-semibold text-ink">{o.shipping.fullName}</strong>, {addressText(o.shipping)}</span>
        </p>
      )}

      <div className="rounded-[14px] border border-brand-line bg-brand-tint px-5 pt-[18px] pb-3.5 [&_.dot]:border-brand-tint">
        <Tracker step={o.step} />
        <p className="mt-3.5 text-center text-[13.5px] font-semibold text-forest">{STEP_MESSAGE[o.step]}</p>
      </div>

      <details className="mt-3.5">
        <summary className="py-1.5 font-semibold text-focus">View items</summary>
        <ul className="mt-1 flex flex-col gap-2 border-t border-line pt-3">
          {o.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-3">
              <span>{i.name}{i.size && <span className="text-muted"> · {i.size}</span>} × {i.qty}</span>
              <span>{money(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
      </details>

      <footer className="mt-3.5 flex justify-end border-t border-line pt-3.5">
        <button className="btn btn-secondary btn-inline px-5 py-[9px]" onClick={orderAgain}>Order again</button>
      </footer>
    </article>
  );
}

function OrdersList() {
  const orders = useMyOrders();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const shown = orders.filter((o) => filter === "all" || o.channel === filter);
  const active = orders.filter((o) => o.step < 3).length;

  return (
    <div className={PAGE_NARROW}>
      <header className="mb-[22px] flex flex-wrap items-end justify-between gap-x-5 gap-y-3.5">
        <div>
          <h1 className={H1.replace("mb-2", "mb-1")}>My orders</h1>
          <p className="text-muted">{orders.length === 0 ? "Track everything you order here." : `${orders.length} ${orders.length === 1 ? "order" : "orders"} · ${active} in progress`}</p>
        </div>
        {orders.length > 0 && (
          <div className="inline-flex gap-1 rounded-full border border-line bg-surface p-1" role="group" aria-label="Filter orders">
            {FILTERS.map((f) => (
              <button key={f.id} className="rounded-full border-0 bg-transparent px-4 py-[7px] font-[650] text-muted transition-colors hover:text-ink aria-pressed:bg-brand aria-pressed:text-white aria-pressed:hover:text-white" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                {f.label} <span className="ml-[3px] font-medium opacity-75">{f.id === "all" ? orders.length : orders.filter((o) => o.channel === f.id).length}</span>
              </button>
            ))}
          </div>
        )}
      </header>

      {orders.length === 0 ? (
        <div className="py-14 text-center">
          <span className="mx-auto mb-2.5 grid size-11 place-items-center rounded-full bg-brand-tint text-brand"><Icon name="orders" /></span>
          <h2 className="text-[22px]">No orders yet</h2>
          <p className="text-muted">Orders you place show up here with their progress.</p>
          <Link to="/" className="btn btn-primary btn-inline mt-4">Start shopping</Link>
        </div>
      ) : shown.length === 0 ? (
        <p className="text-muted">No {filter} orders yet.</p>
      ) : (
        <div className="flex flex-col gap-[18px]">{shown.map((o) => <OrderCard key={o.id} o={o} />)}</div>
      )}
    </div>
  );
}

export function Orders() {
  const { status, error, reload } = useLoadOrders();
  return (
    <LoadGate status={status} error={error} what="your orders" onRetry={reload}>
      <OrdersList />
    </LoadGate>
  );
}
