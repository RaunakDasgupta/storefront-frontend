import { fmtDate, money } from "../../shared/lib/data";
import { STEPS, addressText, itemCount, type Order } from "../../shared/lib/orderlogic";
import { Icon, STEP_BADGE, itemsText } from "../../shared/ui";
import { OC, PC_BTN } from "../ui";
import { ScrollGrid } from "./ScrollGrid";

/** Orders as cards in the scrolling 3 x 2 grid: a status dropdown, where it is going, and a Delete button. */
export function OrderGrid({ orders, onStep, onDelete }: { orders: Order[]; onStep: (id: string, step: number) => void; onDelete: (o: Order) => void }) {
  return (
    <ScrollGrid count={orders.length} rows="taller">
      {orders.map((o) => (
        <article key={o.id} className={`${OC} gap-1`}>
          <span className="flex flex-col items-stretch gap-2">
            <strong className="text-[15px] whitespace-nowrap">{o.id}</strong>
            <select className={`status-select ${STEP_BADGE[o.step]} h-8 w-full min-w-0 px-2.5 text-ellipsis`} aria-label={`Status of ${o.id}`} value={o.step} onChange={(e) => onStep(o.id, Number(e.target.value))}>
              {STEPS.map((label, i) => <option key={label} value={i}>{label}</option>)}
            </select>
          </span>
          <span className="font-semibold">{o.customer.name}</span>
          <span className="line-clamp-2 text-[12.5px] text-muted" title={itemsText(o)}>{itemsText(o)}</span>
          <span className={`mt-1 flex min-w-0 items-start gap-2 rounded-lg bg-soft px-2.5 py-2 text-[12.5px] leading-[1.4] ${o.shipping ? "" : "text-muted"}`} title={o.shipping ? `${o.shipping.fullName}, ${o.shipping.phone}, ${addressText(o.shipping)}` : undefined}>
            <Icon name="truck" className="mt-px size-4 shrink-0" />
            {o.shipping ? (
              <span className="line-clamp-4"><strong>{o.shipping.fullName}</strong> · {o.shipping.phone}<br />{addressText(o.shipping)}</span>
            ) : (
              <span className="line-clamp-4">No delivery address saved</span>
            )}
          </span>
          <span className="mt-auto flex items-baseline justify-between gap-2 text-[12.5px]"><span className="text-muted">{fmtDate(o.date)} · {itemCount(o)} {itemCount(o) === 1 ? "item" : "items"}</span><strong className="text-base">{money(o.total)}</strong></span>
          <span className="flex gap-2">
            <button className={`${PC_BTN} hover:border-danger hover:bg-danger-tint hover:text-danger`} aria-label={`Delete ${o.id}`} onClick={() => onDelete(o)}><Icon name="trash" className="size-[15px]" /> Delete</button>
          </span>
        </article>
      ))}
    </ScrollGrid>
  );
}
