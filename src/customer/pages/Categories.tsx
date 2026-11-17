import { Link } from "react-router-dom";
import { useCategories } from "../categories";
import { CategoryCard } from "../parts";

/** Every category as a card. Reached from "See all categories" on the landing page and in the header dropdown. */
export function Categories() {
  const categories = useCategories();
  return (
    <div className="wrap page">
      <p className="crumbs"><Link to="/">Retail</Link> / Categories</p>
      <h1>All categories</h1>
      <p className="lede">Pick a category to see everything in it.</p>
      <div className="cat-cards cat-cards-page">
        {categories.map((c) => <CategoryCard key={c.name} name={c.name} count={c.count} cover={c.cover} to={c.to} />)}
      </div>
    </div>
  );
}
