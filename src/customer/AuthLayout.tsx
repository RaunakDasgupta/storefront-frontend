import type { ReactNode } from "react";
import { Logo } from "../shared/ui";

/** One centered card for log in and create account. */
export function AuthLayout({ title, subtitle, children, foot }: { title: string; subtitle: string; children: ReactNode; foot?: ReactNode }) {
  return (
    <main className="auth">
      <Logo to="/" label="Storefront" />
      <section className="card">
        <h1>{title}</h1>
        <p className="sub">{subtitle}</p>
        {children}
      </section>
      {foot && <p className="foot">{foot}</p>}
    </main>
  );
}
