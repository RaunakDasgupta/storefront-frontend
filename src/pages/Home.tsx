import { useState, type CSSProperties, type FormEvent } from "react";
import { categories, products } from "../data";
import { Icon, ProductCard, ProductImage } from "../components";

const PERKS = [
  ["Free shipping", "On every order over $50."],
  ["30-day returns", "Changed your mind? Send it back."],
  ["Secure checkout", "Your payment details stay private."],
];

const HERO = [products[0], products[2], products[4]];

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
  const [cat, setCat] = useState<string | null>(null);
  const shown = products.filter((p) => !cat || p.category === cat);

  function pickCategory(c: string) {
    setCat(cat === c ? null : c);
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <>
      <section className="hero">
        <div className="hero-in">
          <div>
            <h1>Everyday goods, made to last.</h1>
            <p>Bags, apparel and home essentials designed to be used every day.</p>
            <a href="#shop" className="btn light inline">Shop all</a>
          </div>
          <div className="collage" aria-hidden="true">
            {HERO.map((p) => <ProductImage key={p.id} p={p} />)}
          </div>
        </div>
      </section>

      <section className="wrap block" aria-labelledby="cats-title">
        <h2 id="cats-title">Shop by category</h2>
        <div className="cols">
          {categories.map((c) => {
            const first = products.find((p) => p.category === c)!;
            const n = products.filter((p) => p.category === c).length;
            return (
              <button key={c} className="coltile" style={{ "--h": first.hue } as CSSProperties} aria-pressed={cat === c} onClick={() => pickCategory(c)}>
                <span className="em" aria-hidden="true">{first.emoji}</span>
                <span><strong>{c}</strong><small>{n} {n === 1 ? "product" : "products"}</small></span>
              </button>
            );
          })}
        </div>
      </section>

      <section id="shop" className="wrap block" aria-labelledby="shop-title">
        <div className="section-head">
          <h2 id="shop-title">{cat ?? "Featured products"}</h2>
          {cat && <button className="linkbtn" onClick={() => setCat(null)}>Show all products</button>}
        </div>
        <div className="grid">{shown.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      <section className="wrap perks">
        {PERKS.map(([title, text]) => (
          <div key={title}><h3>{title}</h3><p className="muted">{text}</p></div>
        ))}
      </section>

      <Newsletter />
    </>
  );
}
