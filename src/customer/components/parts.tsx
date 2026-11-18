import { Link } from "react-router-dom";
import { useAuthDialog } from "./AuthDialog";
import { useCatalog } from "../../shared/hooks/useCatalog";
import { money, type Product } from "../../shared/lib/data";
import { STEPS } from "../../shared/lib/orderlogic";
import { Icon, ProductImage } from "../../shared/ui";
import { useCustomer } from "../hooks/useCustomer";
import { useCart } from "../hooks/useCart";
import { checkoutOpened } from "../store/checkoutSlice";
import { useAppDispatch } from "../store/typedHooks";

/** Stock line under the size: green when plentiful, amber when low, red when gone. */
export function StockNote({ stock, className = "mt-2 mb-0.5" }: { stock: number; className?: string }) {
  const tone = stock === 0 ? "text-danger" : stock < 10 ? "text-[#b26a00]" : "text-brand";
  return (
    <p className={`flex items-center gap-1.5 text-[12.5px] font-[550] ${tone} ${className}`}>
      <i className="size-2 rounded-full bg-current" />{stock === 0 ? "Out of stock" : stock < 10 ? `Only ${stock} left` : "In stock"}
    </p>
  );
}

/** Quantity stepper, also used inside the cart. `wide` is the full-width green one that replaces Add to cart on a product card. */
export function Stepper({ name, qty, onChange, wide }: { name: string; qty: number; onChange: (qty: number) => void; wide?: boolean }) {
  const button = wide ? "h-[38px] w-11 text-lg text-forest" : "h-[30px] w-7 text-base";
  return (
    <div className={`inline-flex items-center rounded-lg border ${wide ? "w-full justify-between border-brand bg-brand-tint" : "border-[#c9c9c9]"}`}>
      <button className={`grid ${button} place-items-center border-0 bg-transparent p-0 ${wide ? "hover:bg-white/50" : "hover:bg-soft"}`} aria-label={`Decrease ${name}`} onClick={() => onChange(qty - 1)}>−</button>
      <span className={`min-w-[22px] text-center ${wide ? "font-bold text-forest" : "font-semibold"}`} aria-live="polite">{qty}</span>
      <button className={`grid ${button} place-items-center border-0 bg-transparent p-0 ${wide ? "hover:bg-white/50" : "hover:bg-soft"}`} aria-label={`Increase ${name}`} onClick={() => onChange(qty + 1)}>+</button>
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { lines, add, setQty } = useCart();
  const inCart = lines.find((l) => l.id === p.id)?.qty ?? 0;
  return (
    <article className="group flex flex-col rounded-2xl border border-transparent p-2.5 pb-3 transition duration-200 hover:-translate-y-0.5 hover:border-line hover:shadow-[0_10px_26px_rgba(0,0,0,.08)] max-sm:p-2 max-sm:pb-2.5">
      <Link to={`/products/${p.id}`} className="no-underline">
        <div className="mb-3 overflow-hidden rounded-xl bg-soft"><ProductImage p={p} className="aspect-[1/.92] transition-transform duration-[450ms] group-hover:scale-105" /></div>
        <h3 className="text-[15px]">{p.name}</h3>
        {p.size && <p className="mt-px text-[12.5px] text-muted">{p.size}</p>}
      </Link>
      <StockNote stock={p.stock} />
      <p className="mt-0.5 mb-2.5 flex items-baseline gap-2 text-base font-bold">{money(p.price)}{p.was && <s className="text-[13px] font-normal text-muted">{money(p.was)}</s>}</p>
      {inCart > 0 ? (
        <div className="mt-auto"><Stepper name={p.name} qty={inCart} onChange={(q) => setQty(p.id, q)} wide /></div>
      ) : (
        <button className="btn btn-primary mt-auto px-3 py-2.5" disabled={p.stock === 0} onClick={() => add(p.id)}>{p.stock === 0 ? "Out of stock" : "Add to cart"}</button>
      )}
    </article>
  );
}

/**
 * A standalone category card: photo, name and product count, linking to that category's full list.
 * `grid` is the square-ish card, `compact` the short one inside the header menu, `fill` takes the height of its row.
 */
export function CategoryCard({ name, count, cover, to, onClick, shape = "grid" }: { name: string; count: number; cover: Product; to: string; onClick?: () => void; shape?: "grid" | "compact" | "fill" }) {
  const box = shape === "compact" ? "h-[116px] rounded-xl" : shape === "fill" ? "h-full snap-start rounded-2xl" : "aspect-[1/.82] rounded-2xl";
  const small = shape === "compact";
  return (
    <Link
      to={to}
      className={`group relative isolate flex w-full items-end self-start overflow-hidden bg-soft text-white no-underline shadow-[0_2px_8px_rgba(0,0,0,.08)] transition duration-[250ms] after:absolute after:inset-0 after:-z-[1] after:bg-[linear-gradient(to_top,rgba(8,40,6,.78),rgba(8,40,6,.1)_62%)] hover:-translate-y-[3px] hover:shadow-[0_12px_26px_rgba(0,0,0,.18)] ${box}`}
      onClick={onClick}
    >
      <ProductImage p={cover} className="absolute inset-0 -z-[2] size-full aspect-auto transition-transform duration-500 group-hover:scale-[1.07]" />
      <span className={`flex flex-col ${small ? "px-3 py-2.5" : "px-4 py-3.5"}`}>
        <strong className={`tracking-[-0.01em] ${small ? "text-sm" : "text-[17px]"}`}>{name}</strong>
        <small className={`${small ? "text-[11.5px]" : "text-[12.5px]"} text-white/85`}>{count} {count === 1 ? "product" : "products"}</small>
      </span>
    </Link>
  );
}

/** A loud call to action that switches between Retail and Bulk orders. Sits right under the intro so it is hard to miss. */
export function ChannelBanner({ channel }: { channel: "retail" | "bulk" }) {
  const { products } = useCatalog();
  const bulk = channel === "retail"; // the Retail page promotes Bulk, and the other way round
  const count = products.filter((p) => p.channel === (bulk ? "bulk" : "retail")).length;
  const c = bulk
    ? { to: "/bulk", tag: "Bulk orders", icon: "truck", title: "Buying in bulk?", text: "Order complete cartons or pallets for your business.", cta: `Browse ${count} bulk packs`, image: "/products/bulk-cartons.jpg" }
    : { to: "/", tag: "Retail", icon: "bag", title: "Need single packs?", text: "Shop individual items for your home.", cta: `Browse ${count} retail products`, image: "/products/tissue-box.jpg" } as const;
  return (
    <section
      className="relative isolate mb-8 flex min-h-[148px] items-center justify-between gap-6 overflow-hidden rounded-[18px] bg-[linear-gradient(100deg,var(--color-forest)_0%,var(--color-brand)_60%,#3fa82c_100%)] px-8 py-7 text-white shadow-[0_12px_30px_rgba(43,138,30,.3)] max-sm:flex-col max-sm:items-start max-sm:gap-4 max-sm:px-5 max-sm:py-[22px]"
      aria-labelledby="banner-title"
    >
      <img
        className="absolute inset-y-0 right-0 -z-10 block h-full w-[46%] object-cover opacity-40 mix-blend-luminosity [mask-image:linear-gradient(to_left,#000_35%,transparent)] max-sm:w-[70%] max-sm:opacity-30"
        src={c.image} alt="" width={1000} height={420} loading="eager"
      />
      <div>
        <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/[.18] py-1 pr-3 pl-2 text-[12.5px] font-[650]"><Icon name={c.icon as "truck" | "bag"} className="size-4" /> {c.tag}</span>
        <h2 id="banner-title" className="text-[32px] font-extrabold tracking-[-0.02em] text-white max-sm:text-[26px]">{c.title}</h2>
        <p className="mt-1 text-base text-white/90">{c.text}</p>
      </div>
      <Link to={c.to} className="btn btn-light btn-inline shrink-0 px-[26px] py-[13px] text-[15px] text-forest shadow-[0_4px_14px_rgba(0,0,0,.2)] hover:-translate-y-px hover:bg-white max-sm:w-full">{c.cta}</Link>
    </section>
  );
}

/** Cart panel: quantities, order total and the demo checkout. */
export function CartPanel() {
  const { items, count, total, setQty } = useCart();
  const { user } = useCustomer();
  const dispatch = useAppDispatch();
  const authDialog = useAuthDialog();
  const mixed = items.some(({ p }) => p.channel === "bulk") && items.some(({ p }) => p.channel === "retail");

  // logged out: log in or sign up in a popup right here instead of sending them to another page; the order is placed afterwards
  const placeOrder = () => (user ? dispatch(checkoutOpened()) : authDialog.open({ mode: "login", reason: "check out", after: { kind: "checkout" } }));

  return (
    <aside className="rounded-[18px] border border-line bg-white p-5 shadow-[0_6px_22px_rgba(0,0,0,.05)] max-sm:p-4" aria-label="Your cart">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[22px] font-[750]">Your cart</h2>
        <span className="rounded-full bg-brand-tint px-2.5 py-[3px] text-[12.5px] font-[650] text-forest">{count} {count === 1 ? "item" : "items"}</span>
      </div>

      {items.length === 0 ? (
        <div className="mb-2 flex flex-col items-center gap-0.5 rounded-xl border border-dashed border-brand-line bg-[#fafdf9] px-3 py-6 text-center text-muted">
          <span className="mb-2 grid size-11 place-items-center rounded-full bg-brand-tint text-brand"><Icon name="bag" /></span>
          <strong className="text-ink">Your cart is empty</strong>
          <span>Add items to get started.</span>
        </div>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {items.map(({ p, qty }) => (
            <li key={p.id} className="grid grid-cols-[52px_minmax(0,1fr)_auto_62px] items-center gap-2.5">
              <ProductImage p={p} small className="size-[52px] rounded-lg" />
              <div className="flex min-w-0 flex-col">
                <strong>{p.name}</strong>
                {p.size && <span className="text-[12.5px] text-muted">{p.size}</span>}
              </div>
              <Stepper name={p.name} qty={qty} onChange={(q) => setQty(p.id, q)} />
              <strong className="text-right text-sm">{money(p.price * qty)}</strong>
            </li>
          ))}
        </ul>
      )}

      <p className="my-3.5 flex items-baseline justify-between gap-3"><span>Order total</span><strong className="text-lg">{money(total)}</strong></p>
      <button className="btn btn-primary" disabled={items.length === 0} onClick={placeOrder}>Checkout</button>
      {mixed && <p className="mt-3 flex items-center gap-2 text-[12.5px] text-muted"><Icon name="truck" className="size-4 shrink-0" /> Retail and bulk items are placed as two separate orders.</p>}
      <p className="mt-3 flex items-center gap-2 text-[12.5px] text-muted"><Icon name="info" className="size-4 shrink-0" /> Demo checkout. No real payment is taken.</p>
    </aside>
  );
}

/** The four fulfilment steps as dots on a line. `className` sizes it where it sits. */
export function Tracker({ step, className = "" }: { step: number; className?: string }) {
  return (
    <ol className={`tracker ${className}`.trim()} aria-label="Order progress">
      {STEPS.map((s, i) => (
        <li key={s} className={i < step ? "done" : i === step ? "now" : ""} aria-current={i === step ? "step" : undefined}>
          <span className="dot">{i < step && <Icon name="check" />}</span>
          <span>{s}</span>
        </li>
      ))}
    </ol>
  );
}
