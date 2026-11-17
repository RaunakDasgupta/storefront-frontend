import type { InputHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

export function AuthShell({ title, subtitle, children, foot }: { title: string; subtitle: string; children: ReactNode; foot?: ReactNode }) {
  return (
    <main className="shell">
      <Link to="/" className="logo" aria-label="Storefront home">
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
