import { useEffect, useRef, useState, type FormEvent } from "react";
import { useLocation } from "react-router-dom";
import { useCatalog } from "../catalog";
import type { Product } from "../data";
import { Icon, ProductCard, ProductImage } from "../components";

const PERKS = [
  { icon: "truck", title: "Free shipping", text: "On every order over ₹999." },
  { icon: "undo", title: "30-day returns", text: "Changed your mind? Send it back." },
  { icon: "lock", title: "Secure checkout", text: "Your payment details stay private." },
] as const;

const TICKER = ["Free shipping over ₹999", "30-day returns", "New arrivals every week", "Secure checkout", "Made to last"];

// shortcut: sample reviews; load real ones from your reviews provider.
const REVIEWS = [
  { name: "Priya S.", item: "Everyday Tote", text: "It has replaced every other bag I own, and it still looks new after six months of daily use." },
  { name: "Daniel K.", item: "Linen Shirt", text: "Soft from the first wash and it fits the way the photos suggest. I ordered a second one." },
  { name: "Marta L.", item: "Desk Lamp", text: "The warm light is easy on the eyes and the base is heavy enough that it never tips." },
];

const BEST_SELLER_IDS = ["everyday-tote", "notebook-set", "canvas-cap", "ceramic-mug", "linen-shirt", "wool-beanie"];

function Stars() {
  return <span className="stars" role="img" aria-label="5 out of 5 stars">{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" filled />)}</span>;
}

function Carousel({ items }: { items: Product[] }) {
  const track = useRef<HTMLDivElement>(null);
  const by = (dir: number) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="carousel">
      <div className="track" ref={track}>
        {items.map((p) => <div className="slide" key={p.id}><ProductCard p={p} /></div>)}
      </div>
      <button className="car-btn prev" aria-label="Previous products" onClick={() => by(-1)}><Icon name="chevL" /></button>
      <button className="car-btn next" aria-label="Next products" onClick={() => by(1)}><Icon name="chevR" /></button>
    </div>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "invalid" | "done">("idle");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // shortcut: nothing is sent anywhere yet; post the address to your mailing-list API here.
    setState(/^\S+@\S+\.\S+$/.test(email.trim()) ? "done" : "invalid");
  }

  return (
    <section className="news">
      <div className="wrap news-in">
        <h2>Subscribe to our emails</h2>
        <p className="muted">Be the first to hear about new products and sales.</p>
        {state === "done" ? (
          <p className="ok" role="status">Thanks for subscribing.</p>
        ) : (
          <form onSubmit={onSubmit} noValidate>
            <div className="news-field">
              <input type="email" aria-label="Email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={state === "invalid" || undefined} />
              <button type="submit" aria-label="Subscribe"><Icon name="arrow" /></button>
            </div>
            <p className="field-error" role="alert" hidden={state !== "invalid"}>Enter a valid email address.</p>
          </form>
        )}
      </div>
    </section>
  );
}

export function Home() {
  const { products, categories } = useCatalog();
  const bestSellers = BEST_SELLER_IDS.map((id) => products.find((p) => p.id === id)).filter((p): p is Product => !!p);
  const [filter, setFilter] = useState<string | null>(null);
  const { hash } = useLocation();
  const shown = products.filter((p) => !filter || (filter === "Sale" ? p.was : p.category === filter));

  // lets header links like /#shop scroll to their section
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
  }, [hash]);

  function pick(f: string | null) {
    setFilter(f === filter ? null : f);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <section className="hero">
        <div className="hero-in">
          <div>
            <h1>Everyday goods, made to last.</h1>
            <p>Bags, apparel and home essentials designed to be used every day.</p>
            <div className="hero-cta">
              <a href="#shop" className="btn light inline">Shop all</a>
              <button className="btn ghost inline" onClick={() => pick("Sale")}>Shop the sale</button>
            </div>
          </div>
          <div className="collage-wrap">
            <div className="collage" aria-hidden="true">
              {[products[0], products[2], products[4]].filter(Boolean).map((p) => <ProductImage key={p.id} p={p} eager />)}
            </div>
            <span className="float top"><Icon name="star" filled /> 4.9 from 2,300 reviews</span>
            <span className="float bottom"><Icon name="truck" /> Free shipping over ₹999</span>
          </div>
        </div>
      </section>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...TICKER, ...TICKER].map((t, i) => <span key={i}>{t}</span>)}
        </div>
      </div>

      <section id="categories" className="wrap block" aria-labelledby="cats-title">
        <h2 id="cats-title">Shop by category</h2>
        <div className="cols">
          {categories.map((c) => {
            const first = products.find((p) => p.category === c)!;
            const n = products.filter((p) => p.category === c).length;
            return (
              <button key={c} className="coltile" aria-pressed={filter === c} onClick={() => pick(c)}>
                <ProductImage p={first} />
                <span className="coltile-label">
                  <strong>{c}</strong>
                  <small>{n} {n === 1 ? "product" : "products"}</small>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="wrap block" aria-labelledby="best-title">
        <h2 id="best-title">Best sellers</h2>
        <Carousel items={bestSellers} />
      </section>

      <section className="wrap block">
        <div className="promo">
          <div className="promo-art" aria-hidden="true">
            <ProductImage p={products[3]} />
            <ProductImage p={products[4]} />
          </div>
          <div className="promo-copy">
            <h2>Up to 25% off select pieces</h2>
            <p>Linen shirts and desk lamps are on sale while stock lasts.</p>
            <button className="btn primary inline" onClick={() => pick("Sale")}>Shop the sale</button>
          </div>
        </div>
      </section>

      <section id="shop" className="wrap block" aria-labelledby="shop-title">
        <div className="section-head">
          <h2 id="shop-title">{filter ?? "All products"}</h2>
          {filter && <button className="linkbtn" onClick={() => setFilter(null)}>Show all products</button>}
        </div>
        <div className="grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      <section id="reviews" className="wrap block" aria-labelledby="rev-title">
        <h2 id="rev-title">Loved by customers</h2>
        <div className="reviews">
          {REVIEWS.map((r) => (
            <figure key={r.name} className="review">
              <Stars />
              <blockquote>{r.text}</blockquote>
              <figcaption><strong>{r.name}</strong><span className="muted">Bought the {r.item}</span></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="wrap perks">
        {PERKS.map((p) => (
          <div key={p.title}><span className="perk-icon"><Icon name={p.icon} /></span><h3>{p.title}</h3><p className="muted">{p.text}</p></div>
        ))}
      </section>

      <Newsletter />
    </>
  );
}
