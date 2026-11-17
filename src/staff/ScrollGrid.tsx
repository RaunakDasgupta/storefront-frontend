import { useRef, type ReactNode } from "react";
import { Icon } from "../shared/ui";

/** A 3 x 2 grid of cards that scrolls sideways once there are more than 6 (a sliver of the next column hints at it). */
export function ScrollGrid({ count, children, tall }: { count: number; children: ReactNode; tall?: boolean }) {
  const track = useRef<HTMLDivElement>(null);
  const by = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.9, behavior: "smooth" });
  return (
    <div className="grid-scroller">
      <div className={tall ? "order-grid tall" : "order-grid"} ref={track}>{children}</div>
      {count > 6 && (
        <>
          <button className="grid-btn prev" aria-label="Scroll left" onClick={() => by(-1)}><Icon name="chevL" /></button>
          <button className="grid-btn next" aria-label="Scroll right" onClick={() => by(1)}><Icon name="chevR" /></button>
        </>
      )}
    </div>
  );
}
