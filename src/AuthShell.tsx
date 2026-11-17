import type { InputHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";
import { ProductImage } from "./components";
import { products } from "./data";

const PANES = {
  store: { headline: "Everyday goods, made to last.", text: "Track your orders, save your details and check out faster." },
  staff: { headline: "Run the store from one place.", text: "Manage orders, products and inventory in the staff portal." },
};

const ART = [products[0], products[2], products[4]];

export function AuthShell({ title, subtitle, children, foot, staff }: { title: string; subtitle: string; children: ReactNode; foot?: ReactNode; staff?: boolean }) {
  const pane = staff ? PANES.staff : PANES.store;
  return (
    <div className="split">
      <aside className="brandpane">
        <Link to="/" className="logo light" aria-label="Storefront home">
          <span className="logo-mark" aria-hidden="true">S</span>
          Storefront
        </Link>
        <div>
          <h2>{pane.headline}</h2>
          <p>{pane.text}</p>
          <div className="pane-art" aria-hidden="true">{ART.map((p) => <ProductImage key={p.id} p={p} />)}</div>
        </div>
        <p className="pane-copy">© {new Date().getFullYear()} Storefront</p>
      </aside>
      <main className="formpane">
        <Link to="/" className="logo mobile-logo" aria-label="Storefront home">
          <span className="logo-mark" aria-hidden="true">S</span>
          Storefront
        </Link>
        <section className="card">
          <h1>{title}</h1>
          <p className="sub">{subtitle}</p>
          {children}
        </section>
        {foot && <p className="foot">{foot}</p>}
      </main>
    </div>
  );
}

export function Field({ id, label, error, ...input }: { id: string; label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} {...input} />
      {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
    </div>
  );
}
