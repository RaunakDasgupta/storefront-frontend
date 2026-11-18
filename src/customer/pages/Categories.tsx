import { useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icon } from "../../shared/ui";
import { useCategories } from "../hooks/useCategories";
import { CategoryCard } from "../components/parts";
import { CRUMBS, H1, LEDE, PAGE, ROW_BTN } from "../ui";

/** Every category as a card, for Retail or (with ?channel=bulk) Bulk orders. A 3 x 2 grid that scrolls sideways when there are more than 6. */
export function Categories() {
  const [params] = useSearchParams();
  const channel = params.get("channel") === "bulk" ? "bulk" : "retail";
  const categories = useCategories(channel);
  const track = useRef<HTMLDivElement>(null);
  const by = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.9, behavior: "smooth" });
  return (
    <div className={PAGE}>
      <p className={CRUMBS}><Link to={channel === "bulk" ? "/bulk" : "/"}>{channel === "bulk" ? "Bulk orders" : "Retail"}</Link> / Categories</p>
      <h1 className={H1}>All categories</h1>
      <p className={LEDE}>Pick a category to see everything in it.{categories.length > 6 && " Scroll sideways for more."}</p>
      <div className="relative mt-6">
        <div className="-mx-1 grid snap-x snap-mandatory auto-cols-[calc((100%-40px)/3.15)] grid-flow-col grid-rows-[repeat(2,200px)] gap-5 overflow-x-auto px-1 pt-1 pb-3 [scrollbar-width:none] max-sm:auto-cols-[calc((100%-12px)/2.2)] max-sm:grid-rows-[repeat(2,150px)] max-sm:gap-3 [&::-webkit-scrollbar]:hidden" ref={track}>
          {categories.map((c) => <CategoryCard key={c.name} name={c.name} count={c.count} cover={c.cover} to={c.to} shape="fill" />)}
        </div>
        {categories.length > 6 && (
          <>
            <button className={`${ROW_BTN} top-[calc(50%-19px)] -left-3.5`} aria-label="Scroll categories left" onClick={() => by(-1)}><Icon name="chevL" className="size-5" /></button>
            <button className={`${ROW_BTN} top-[calc(50%-19px)] -right-3.5`} aria-label="Scroll categories right" onClick={() => by(1)}><Icon name="chevR" className="size-5" /></button>
          </>
        )}
      </div>
    </div>
  );
}
