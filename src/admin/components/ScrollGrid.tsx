import { useRef, type ReactNode } from "react";
import { Icon } from "../../shared/ui";
import { SCROLL_BTN } from "../ui";

/** The height of the two rows: `tall` for product cards, `taller` for order cards (which hold an address). */
const ROWS = { default: "grid-rows-[repeat(2,160px)]", tall: "grid-rows-[repeat(2,188px)]", taller: "grid-rows-[repeat(2,316px)]" } as const;

/** A 3 x 2 grid of cards that scrolls sideways once there are more than 6 (a sliver of the next column hints at it). */
export function ScrollGrid({ count, children, rows = "default" }: { count: number; children: ReactNode; rows?: keyof typeof ROWS }) {
  const track = useRef<HTMLDivElement>(null);
  const by = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.9, behavior: "smooth" });
  return (
    <div className="relative">
      <div
        className={`-mx-1 grid snap-x snap-mandatory auto-cols-[calc((100%-32px)/3.15)] grid-flow-col gap-4 overflow-x-auto px-1 pt-1 pb-3 [scrollbar-width:none] max-sm:auto-cols-[calc((100%-12px)/1.5)] max-sm:gap-3 [&::-webkit-scrollbar]:hidden ${ROWS[rows]}`}
        ref={track}
      >
        {children}
      </div>
      {count > 6 && (
        <>
          <button className={`${SCROLL_BTN} top-[calc(50%-19px)] -left-3.5`} aria-label="Scroll left" onClick={() => by(-1)}><Icon name="chevL" className="size-5" /></button>
          <button className={`${SCROLL_BTN} top-[calc(50%-19px)] -right-3.5`} aria-label="Scroll right" onClick={() => by(1)}><Icon name="chevR" className="size-5" /></button>
        </>
      )}
    </div>
  );
}
