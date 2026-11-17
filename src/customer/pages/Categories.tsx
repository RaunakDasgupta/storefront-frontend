import { Link, useSearchParams } from "react-router-dom";
import { useCategories } from "../categories";
import { CategoryCard } from "../parts";

/** Every category as a card, for Retail or (with ?channel=bulk) Bulk orders. */
export function Categories() {
  const [params] = useSearchParams();
  const channel = params.get("channel") === "bulk" ? "bulk" : "retail";
  const categories = useCategories(channel);
  return (
    <div className="wrap page">
      <p className="crumbs"><Link to={channel === "bulk" ? "/bulk" : "/"}>{channel === "bulk" ? "Bulk orders" : "Retail"}</Link> / Categories</p>
      <h1>All categories</h1>
      <p className="lede">Pick a category to see everything in it.</p>
      <div className="cat-cards cat-cards-page">
        {categories.map((c) => <CategoryCard key={c.name} name={c.name} count={c.count} cover={c.cover} to={c.to} />)}
      </div>
    </div>
  );
}
