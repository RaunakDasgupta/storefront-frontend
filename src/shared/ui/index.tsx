// Small building blocks used by both the customer and the admin app. No routes, no auth, no app state.
import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { imageSrc, money, type Product } from "../lib/data";
import type { Order } from "../lib/orderlogic";
import { useTheme } from "../theme";

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
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4" /></>,
  moon: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
};

/** `className` is for a size (size-5) or colour (text-brand); the icon takes the text colour by default. */
export function Icon({ name, className = "" }: { name: keyof typeof ICONS; className?: string }) {
  return <svg className={`icon ${className}`.trim()} viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>;
}

export function Logo({ to, label, className = "" }: { to: string; label: string; className?: string }) {
  return (
    <Link to={to} className={`inline-flex items-center gap-2.5 text-xl font-bold tracking-[-0.02em] text-ink no-underline ${className}`.trim()}>
      <span className="grid size-[34px] shrink-0 place-items-center rounded-[10px] bg-brand text-white" aria-hidden="true"><Icon name="bag" className="size-5" /></span>
      <span className="max-[340px]:hidden">{label}</span>
    </Link>
  );
}

/** Product photo. Decorative (alt="") unless the caller passes alt, e.g. when no name sits next to it. It fills its width and is square, unless `className` sets a size (w-*, size-*) or an aspect-* itself. */
/** The round letter button for the signed-in person; blank (grey) when nobody is signed in. */
export function Avatar({ letter }: { letter?: string }) {
  return (
    <span className={`grid size-[30px] place-items-center rounded-full text-[13px] leading-none font-bold ${letter ? "bg-brand text-white" : "bg-line shadow-[inset_0_0_0_1px_var(--color-edge-soft)]"}`}>{letter}</span>
  );
}

export function ProductImage({ p, alt = "", className = "", eager, small }: { p: Product; alt?: string; className?: string; eager?: boolean; small?: boolean }) {
  return (
    <img
      className={`block bg-soft object-cover ${/(^|\s)(size|w)-/.test(className) ? "" : "h-auto w-full"} ${/(^|\s)aspect-/.test(className) ? "" : "aspect-square"} ${className}`.trim().replace(/\s+/g, " ")}
      src={imageSrc(p, small)}
      alt={alt}
      width={small ? 200 : 900}
      height={small ? 200 : 900}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={(e) => {
        const img = e.currentTarget;
        // a missing thumbnail falls back to the full photo first, then to the placeholder
        const full = imageSrc(p);
        if (small && img.getAttribute("src") !== full) img.src = full;
        else { img.onerror = null; img.src = "/products/placeholder.svg"; }
      }}
    />
  );
}

export function Price({ p }: { p: Product }) {
  return (
    <p className="mt-0.5 flex gap-2">
      <span className={p.was ? "text-danger" : undefined}>{money(p.price)}</span>
      {p.was && <s className="text-muted">{money(p.was)}</s>}
    </p>
  );
}

export function Field({ id, label, error, ...input }: { id: string; label: string; error?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="mb-4">
      <label htmlFor={id}>{label}</label>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} {...input} />
      {error && <p className="mt-1.5 text-[13px] text-danger" id={`${id}-error`}>{error}</p>}
    </div>
  );
}

const ICON_BUTTON = "relative inline-grid size-10 place-items-center rounded-full border-0 bg-transparent p-0 text-ink transition-colors hover:bg-soft aria-expanded:bg-soft";

/** Button with a dropdown. Closes on Escape or an outside click. `kind="menu"` is a list of actions; `kind="panel"` is a richer panel such as a card grid. */
export function Menu({ label, trigger, children, buttonClass = ICON_BUTTON, panelClass = "", wrapperClass = "", kind = "menu" }: {
  label: string; trigger: ReactNode; children: (close: () => void) => ReactNode; buttonClass?: string; panelClass?: string; wrapperClass?: string; kind?: "menu" | "panel";
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
    <div className={`relative ${wrapperClass}`.trim()} ref={ref}>
      <button className={buttonClass} aria-label={label} aria-haspopup={kind === "menu" ? "menu" : "true"} aria-expanded={open} onClick={() => setOpen((o) => !o)}>{trigger}</button>
      {open && <div className={`dropdown ${panelClass}`.trim()} role={kind === "menu" ? "menu" : "group"} aria-label={kind === "panel" ? label : undefined}>{children(() => setOpen(false))}</div>}
    </div>
  );
}

/** "Detergent (Carton of 12 x 1 kg) × 1, ..." so a bulk pack is distinct from the retail item. */
export const itemsText = (o: Order) => o.items.map((i) => `${i.name}${i.size ? ` (${i.size})` : ""} × ${i.qty}`).join(", ");

/** Colour classes (see index.css) for each fulfilment step, used by badges and the status dropdown. */
export const STEP_BADGE = ["tone-pending", "tone-paid", "tone-packed", "tone-fulfilled"] as const;

/** Shows what a screen needs once it has loaded; until then a loading note, or the error with a Try again button. */
export function LoadGate({ status, error, what, onRetry, children }: { status: "idle" | "loading" | "ready" | "failed"; error: string | null; what: string; onRetry: () => void; children: ReactNode }) {
  if (status === "ready") return <>{children}</>;
  if (status === "failed") {
    return (
      <div className="px-4 py-14 text-center" role="alert">
        <h2 className="mb-1.5 text-xl">Couldn&apos;t load {what}</h2>
        <p className="text-muted">{error}</p>
        <button className="btn btn-primary btn-inline mt-4" onClick={onRetry}>Try again</button>
      </div>
    );
  }
  return <p className="px-4 py-14 text-center text-muted" role="status">Loading {what}…</p>;
}

/** The sun / moon button that switches light and dark mode. */
export function ThemeToggle() {
  const [theme, toggle] = useTheme();
  const dark = theme === "dark";
  return (
    <button type="button" className={ICON_BUTTON} aria-label="Dark mode" aria-pressed={dark} title={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={toggle}>
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}
