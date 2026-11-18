import { fmtDate, money } from "../../shared/lib/data";
import { STEPS, addressText, itemCount, type Order } from "../../shared/lib/orderlogic";
import { Icon, STEP_BADGE, itemsText } from "../../shared/ui";
import { ScrollGrid } from "./ScrollGrid";

/** Orders as cards in the scrolling 3 x 2 grid: a status dropdown, where it is going, and a Delete button. */
export function OrderGrid({ orders, onStep, onDelete }: { orders: Order[]; onStep: (id: string, step: number) => void; onDelete: (o: Order) => void }) {
  return (
    <ScrollGrid count={orders.length} rows="taller">
      {orders.map((o) => (
        <article key={o.id} className="oc editable">
          <span className="oc-top">
            <strong>{o.id}</strong>
            <select className={`status-select ${STEP_BADGE[o.step]}`} aria-label={`Status of ${o.id}`} value={o.step} onChange={(e) => onStep(o.id, Number(e.target.value))}>
              {STEPS.map((label, i) => <option key={label} value={i}>{label}</option>)}
            </select>
          </span>
          <span className="oc-customer">{o.customer.name}</span>
          <span className="oc-items muted" title={itemsText(o)}>{itemsText(o)}</span>
          {o.shipping ? (
            <span className="oc-ship" title={`${o.shipping.fullName}, ${o.shipping.phone}, ${addressText(o.shipping)}`}>
              <Icon name="truck" />
              <span><strong>{o.shipping.fullName}</strong> · {o.shipping.phone}<br />{addressText(o.shipping)}</span>
            </span>
          ) : (
            <span className="oc-ship muted"><Icon name="truck" /><span>No delivery address saved</span></span>
          )}
          <span className="oc-foot"><span className="muted">{fmtDate(o.date)} · {itemCount(o)} {itemCount(o) === 1 ? "item" : "items"}</span><strong>{money(o.total)}</strong></span>
          <span className="pc-actions">
            <button className="pc-btn pc-del" aria-label={`Delete ${o.id}`} onClick={() => onDelete(o)}><Icon name="trash" /> Delete</button>
          </span>
        </article>
      ))}
    </ScrollGrid>
  );
}
