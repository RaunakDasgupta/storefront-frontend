import { useRef } from "react";
import { Link } from "react-router-dom";
import { fmtDate, money } from "../shared/data";
import { STEPS, itemCount, type Order } from "../shared/orderlogic";
import { Icon, STEP_BADGE, itemsText } from "../shared/ui";

/** Orders as cards in a 3 x 2 grid that scrolls sideways when there are more than 6. A card opens that order in the Orders list. */
export function OrderGrid({ orders }: { orders: Order[] }) {
  const track = useRef<HTMLDivElement>(null);
  const by = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.9, behavior: "smooth" });
  return (
    <div className="grid-scroller">
      <div className="order-grid" ref={track}>
        {orders.map((o) => (
          <Link key={o.id} to={`/staff/orders?type=${o.channel}&q=${o.id}`} className="oc" aria-label={`Open ${o.id}`}>
            <span className="oc-top"><strong>{o.id}</strong><span className={`badge ${STEP_BADGE[o.step]}`}>{STEPS[o.step]}</span></span>
            <span className="oc-customer">{o.customer.name}</span>
            <span className="oc-items muted">{itemsText(o)}</span>
            <span className="oc-foot"><span className="muted">{fmtDate(o.date)} · {itemCount(o)} {itemCount(o) === 1 ? "item" : "items"}</span><strong>{money(o.total)}</strong></span>
          </Link>
        ))}
      </div>
      {orders.length > 6 && (
        <>
          <button className="grid-btn prev" aria-label="Scroll orders left" onClick={() => by(-1)}><Icon name="chevL" /></button>
          <button className="grid-btn next" aria-label="Scroll orders right" onClick={() => by(1)}><Icon name="chevR" /></button>
        </>
      )}
    </div>
  );
}
