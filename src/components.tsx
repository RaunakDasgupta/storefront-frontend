import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { homeFor, useAuth } from "./auth";
import { useCart } from "./cart";
import { money, type Product } from "./data";

const ICONS = {
  bag: <><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8a3 3 0 016 0" /></>,
  home: <path d="M4 11l8-7 8 7v9H4z" />,
  orders: <><path d="M4 13l3-8h10l3 8v6H4z" /><path d="M4 13h5l1 2h4l1-2h5" /></>,
  products: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevL: <path d="M15 5l-7 7 7 7" />,
  chevR: <path d="M9 5l7 7-7 7" />,
  truck: <><path d="M2 6h11v10H2z" /><path d="M13 9h5l3 3v4h-8" /><circle cx="7" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></>,
  undo: <><path d="M9 14L4 9l5-5" /><path d="M4 9h11a5 5 0 010 10h-3" /></>,
  lock: <><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></>,
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
};

export function Icon({ name, filled }: { name: keyof typeof ICONS; filled?: boolean }) {
  return <svg className={filled ? "icon fill" : "icon"} viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>;
}

/** Soft studio-style placeholder until real product photos exist. */
export function ProductImage({ p }: { p: Product }) {
  return (
    <div className="pimg" style={{ "--h": p.hue } as CSSProperties} aria-hidden="true">
      <span className="em">{p.emoji}</span>
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  const soldOut = p.stock === 0;
  return (
    <article className="pcard">
      <div className="media">
        <Link to={`/products/${p.id}`} tabIndex={-1}><ProductImage p={p} /></Link>
        {soldOut ? <span className="tag dark">Sold out</span> : p.was && <span className="tag">Sale</span>}
        {!soldOut && <button className="btn light quick" onClick={() => add(p.id)}>Quick add</button>}
      </div>
      <Link to={`/products/${p.id}`} className="pname">{p.name}</Link>
      <Price p={p} />
    </article>
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

/** Profile avatar: blank when logged out, with a dropdown for log in / create account. */
function AccountMenu() {
  const { user, signOut } = useAuth();
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

  const close = () => setOpen(false);

  return (
    <div className="menu" ref={ref}>
      <button className="iconbtn" aria-label="Account menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className={user ? "avatar" : "avatar blank"}>{user?.name[0]?.toUpperCase()}</span>
      </button>
      {open && (
        <div className="dropdown" role="menu">
          {user ? (
            <>
              <div className="dd-head"><strong>{user.name}</strong><span className="muted">{user.email ?? user.role}</span></div>
              <Link role="menuitem" to={user.role === "employee" ? "/staff" : "/account"} onClick={close}>{user.role === "employee" ? "Staff portal" : "My account"}</Link>
              <button role="menuitem" onClick={() => { close(); signOut(); }}>Log out</button>
            </>
          ) : (
            <>
              <div className="dd-head"><strong>Welcome</strong><span className="muted">Log in to see your orders.</span></div>
              <Link role="menuitem" className="dd-primary" to="/login" onClick={close}>Log in</Link>
              <Link role="menuitem" to="/signup" onClick={close}>Create account</Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function StoreLayout() {
  const { count } = useCart();
  return (
    <>
      <div className="announce">Free shipping on orders over $50</div>
      <header className="topbar">
        <Link to="/" className="logo"><span className="logo-mark" aria-hidden="true">S</span><span className="logo-text">Storefront</span></Link>
        <nav className="topnav" aria-label="Main">
          <NavLink to="/" end>Home</NavLink>
          <Link to="/#shop">Shop</Link>
          <Link to="/#categories">Categories</Link>
          <Link to="/#reviews">Reviews</Link>
        </nav>
        <div className="tools">
          <Link to="/cart" className="iconbtn" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
            <Icon name="bag" />
            {count > 0 && <span className="count">{count}</span>}
          </Link>
          <AccountMenu />
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="footer">
        <div className="wrap foot-grid">
          <div>
            <Link to="/" className="logo"><span className="logo-mark" aria-hidden="true">S</span><span className="logo-text">Storefront</span></Link>
            <p className="muted">Everyday goods for your home, your desk and your day.</p>
          </div>
          <nav aria-label="Shop">
            <h3>Shop</h3>
            <Link to="/#shop">All products</Link>
            <Link to="/#categories">Categories</Link>
            <Link to="/cart">Cart</Link>
          </nav>
          <nav aria-label="Account">
            <h3>Account</h3>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Create account</Link>
          </nav>
        </div>
        <p className="wrap copy">© {new Date().getFullYear()} Storefront</p>
      </footer>
    </>
  );
}

export function StaffLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="admin">
      <header className="atop">
        <Link to={homeFor("employee")} className="logo"><span className="logo-mark" aria-hidden="true">S</span><span className="logo-text">Storefront</span></Link>
        <div className="atop-r">
          <Link to="/">View store</Link>
          <span className="avatar" aria-hidden="true">{user?.name[0]?.toUpperCase()}</span>
          <button className="linkbtn" onClick={() => { signOut(); navigate("/login"); }}>Log out</button>
        </div>
      </header>
      <aside className="side">
        <nav aria-label="Staff">
          <NavLink to="/staff" end><Icon name="home" />Home</NavLink>
          <NavLink to="/staff/orders"><Icon name="orders" />Orders</NavLink>
          <NavLink to="/staff/products"><Icon name="products" />Products</NavLink>
        </nav>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}
