import { Link } from "react-router-dom";
import { fmtDate, money } from "../../shared/lib/data";
import { STEPS, itemCount, type Order } from "../../shared/lib/orderlogic";
import { Icon, STEP_BADGE, itemsText } from "../../shared/ui";
import { ScrollGrid } from "./ScrollGrid";

function Body({ o }: { o: Order }) {
  return (
    <>
      <span className="oc-customer">{o.customer.name}</span>
      <span className="oc-items muted" title={itemsText(o)}>{itemsText(o)}</span>
      <span className="oc-foot"><span className="muted">{fmtDate(o.date)} · {itemCount(o)} {itemCount(o) === 1 ? "item" : "items"}</span><strong>{money(o.total)}</strong></span>
    </>
  );
}

/**
 * Orders as cards in the scrolling 3 x 2 grid.
 * Read-only cards open that order in the Orders list; with `onStep` the card has a status dropdown instead, and `onDelete` adds a Delete button.
 */
export function OrderGrid({ orders, onStep, onDelete }: { orders: Order[]; onStep?: (id: string, step: number) => void; onDelete?: (o: Order) => void }) {
  return (
    <ScrollGrid count={orders.length} rows={onStep ? "taller" : undefined}>
      {orders.map((o) =>
        onStep ? (
          <article key={o.id} className="oc editable">
            <span className="oc-top">
              <strong>{o.id}</strong>
              <select className={`status-select ${STEP_BADGE[o.step]}`} aria-label={`Status of ${o.id}`} value={o.step} onChange={(e) => onStep(o.id, Number(e.target.value))}>
                {STEPS.map((label, i) => <option key={label} value={i}>{label}</option>)}
              </select>
            </span>
            <Body o={o} />
            {onDelete && (
              <span className="pc-actions">
                <button className="pc-btn pc-del" aria-label={`Delete ${o.id}`} onClick={() => onDelete(o)}><Icon name="trash" /> Delete</button>
              </span>
            )}
          </article>
        ) : (
          <Link key={o.id} to={`/staff/orders?type=${o.channel}&q=${o.id}`} className="oc" aria-label={`Open ${o.id}`}>
            <span className="oc-top"><strong>{o.id}</strong><span className={`badge ${STEP_BADGE[o.step]}`}>{STEPS[o.step]}</span></span>
            <Body o={o} />
          </Link>
        ),
      )}
    </ScrollGrid>
  );
}
