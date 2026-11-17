// Small building blocks used by both the customer and the staff app. No routes, no auth, no app state.
import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { imageSrc, money, type Product } from "./data";
import type { Order } from "./orderlogic";

const ICONS = {
  bag: <><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8a3 3 0 016 0" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>,
  home: <path d="M4 11l8-7 8 7v9H4z" />,
  orders: <><path d="M4 13l3-8h10l3 8v6H4z" /><path d="M4 13h5l1 2h4l1-2h5" /></>,
  products: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>,
  truck: <><path d="M2 6h11v10H2z" /><path d="M13 9h5l3 3v4h-8" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
  undo: <><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 010 10h-3" /></>,
  chevD: <path d="M6 9l6 6 6-6" />,
  chevL: <path d="M15 5l-7 7 7 7" />,
  chevR: <path d="M9 5l7 7-7 7" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16v4z" /><path d="M13.5 6.5l4 4" /></>,
  trash: <><path d="M4 7h16M10 7V5h4v2" /><path d="M6.5 7l1 12h9l1-12M10 11v5M14 11v5" /></>,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.01" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
};

export function Icon({ name }: { name: keyof typeof ICONS }) {
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>;
}

export function Logo({ to, label, className = "" }: { to: string; label: string; className?: string }) {
  return (
    <Link to={to} className={`logo ${className}`.trim()}>
      <span className="logo-mark" aria-hidden="true"><Icon name="bag" /></span>
      <span className="logo-text">{label}</span>
    </Link>
  );
}

/** Product photo. Decorative (alt="") unless the caller passes alt, e.g. when no name sits next to it. */
export function ProductImage({ p, alt = "", className = "", eager, small }: { p: Product; alt?: string; className?: string; eager?: boolean; small?: boolean }) {
  return (
    <img
      className={`pimg ${className}`.trim()}
      src={imageSrc(p, small)}
      alt={alt}
      width={small ? 200 : 900}
      height={small ? 200 : 900}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/products/placeholder.svg"; }}
    />
  );
}

export function Price({ p }: { p: Product }) {
  return (
    <p className="pprice">
      <span className={p.was ? "now sale" : "now"}>{money(p.price)}</span>
      {p.was && <s className="was">{money(p.was)}</s>}
    </p>
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

/** Button with a dropdown. Closes on Escape or an outside click. `kind="menu"` is a list of actions; `kind="panel"` is a richer panel such as a card grid. */
export function Menu({ label, trigger, children, buttonClass = "iconbtn", panelClass = "", kind = "menu" }: {
  label: string; trigger: ReactNode; children: (close: () => void) => ReactNode; buttonClass?: string; panelClass?: string; kind?: "menu" | "panel";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      ref.current?.querySelector("button")?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="menu" ref={ref}>
      <button className={buttonClass} aria-label={label} aria-haspopup={kind === "menu" ? "menu" : "true"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{trigger}</button>
      {open && <div className={`dropdown ${panelClass}`.trim()} role={kind === "menu" ? "menu" : "group"} aria-label={kind === "panel" ? label : undefined}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

/** "Detergent (Carton of 12 x 1 kg) × 1, ..." so a bulk pack is distinct from the retail item. */
export const itemsText = (o: Order) => o.items.map((i) => `${i.name}${i.size ? ` (${i.size})` : ""} × ${i.qty}`).join(", ");

export const STEP_BADGE = ["pending", "paid", "packed", "fulfilled"] as const;
