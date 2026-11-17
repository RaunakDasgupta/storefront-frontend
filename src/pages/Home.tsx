import { useState } from "react";
import { categories, products } from "../data";
import { ProductCard } from "../components";

const PERKS = [
  ["Free shipping", "On every order over $50."],
  ["30-day returns", "Changed your mind? Send it back."],
  ["Secure checkout", "Your payment details stay private."],
];

export function Home() {
  const [cat, setCat] = useState("All");
  const shown = products.filter((p) => cat === "All" || p.category === cat);

  return (
    <>
      <section className="hero">
        <h1>Everyday goods, made to last.</h1>
        <p>Thoughtfully designed essentials for your home, your desk and your day.</p>
        <a href="#shop" className="btn primary inline">Shop the collection</a>
      </section>

      <section id="shop" aria-labelledby="shop-title">
        <div className="section-head">
          <h2 id="shop-title">Featured products</h2>
          <div className="chips" role="group" aria-label="Filter by category">
            {categories.map((c) => (
              <button key={c} className="chip" aria-pressed={c === cat} onClick={() => setCat(c)}>{c}</button>
            ))}
          </div>
        </div>
        <div className="grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      <section className="perks">
        {PERKS.map(([title, text]) => (
          <div key={title}><h3>{title}</h3><p className="muted">{text}</p></div>
        ))}
      </section>
    </>
  );
}
