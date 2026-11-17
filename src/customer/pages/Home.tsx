import { Link } from "react-router-dom";
import { useCatalog } from "../../shared/catalog";
import { Icon, ProductImage } from "../../shared/ui";
import { ProductCard } from "../ProductCard";

const PERKS = [
  { icon: "truck", title: "Free shipping", text: "On orders over ₹999." },
  { icon: "undo", title: "30-day returns", text: "Send it back if it's not right." },
  { icon: "lock", title: "Secure checkout", text: "Your payment details stay private." },
] as const;

export function Home() {
  const { products, categories } = useCatalog();
  const hero = products[0];

  return (
    <>
      <section className="hero">
        <div className="hero-in">
          <div>
            <h1>Everyday goods, made to last.</h1>
            <p>Bags, apparel and home essentials designed to be used every day.</p>
            <div className="hero-cta">
              <Link to="/shop" className="btn primary inline">Shop all</Link>
              <Link to="/shop?sale=1" className="btn secondary inline">View sale</Link>
            </div>
          </div>
          {hero && <ProductImage p={hero} alt={hero.name} eager />}
        </div>
      </section>

      <section className="wrap block" aria-labelledby="cats-title">
        <h2 id="cats-title">Shop by category</h2>
        <div className="cols">
          {categories.map((c) => {
            const first = products.find((p) => p.category === c)!;
            return (
              <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`} className="coltile">
                <ProductImage p={first} />
                <strong>{c}</strong>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="wrap block" aria-labelledby="feat-title">
        <div className="section-head">
          <h2 id="feat-title">Featured</h2>
          <Link to="/shop" className="link">View all products</Link>
        </div>
        <div className="grid">{products.slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      <section className="wrap perks">
        {PERKS.map((p) => (
          <div key={p.title}><span className="perk-icon"><Icon name={p.icon} /></span><h3>{p.title}</h3><p className="muted">{p.text}</p></div>
        ))}
      </section>
    </>
  );
}
