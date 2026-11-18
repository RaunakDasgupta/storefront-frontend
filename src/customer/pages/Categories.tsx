import { useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Icon } from "../../shared/ui";
import { useCategories } from "../hooks/useCategories";
import { CategoryCard } from "../components/parts";

/** Every category as a card, for Retail or (with ?channel=bulk) Bulk orders. A 3 x 2 grid that scrolls sideways when there are more than 6. */
export function Categories() {
  const [params] = useSearchParams();
  const channel = params.get("channel") === "bulk" ? "bulk" : "retail";
  const categories = useCategories(channel);
  const track = useRef<HTMLDivElement>(null);
  const by = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.9, behavior: "smooth" });
  return (
    <div className="wrap page">
      <p className="crumbs"><Link to={channel === "bulk" ? "/bulk" : "/"}>{channel === "bulk" ? "Bulk orders" : "Retail"}</Link> / Categories</p>
      <h1>All categories</h1>
      <p className="lede">Pick a category to see everything in it.{categories.length > 6 && " Scroll sideways for more."}</p>
      <div className="cat-scroller">
        <div className="cat-cards cat-cards-page" ref={track}>
          {categories.map((c) => <CategoryCard key={c.name} name={c.name} count={c.count} cover={c.cover} to={c.to} />)}
        </div>
        {categories.length > 6 && (
          <>
            <button className="row-btn prev" aria-label="Scroll categories left" onClick={() => by(-1)}><Icon name="chevL" /></button>
            <button className="row-btn next" aria-label="Scroll categories right" onClick={() => by(1)}><Icon name="chevR" /></button>
          </>
        )}
      </div>
    </div>
  );
}
