import type { CSSProperties } from "react";
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
};

export function Icon({ name }: { name: keyof typeof ICONS }) {
  return <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">{ICONS[name]}</svg>;
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

export function StoreLayout() {
  const { user, signOut } = useAuth();
  const { count } = useCart();
  return (
    <>
      <div className="announce">Free shipping on orders over $50</div>
      <header className="topbar">
        <Link to="/" className="logo"><span className="logo-mark" aria-hidden="true">S</span>Storefront</Link>
        <nav className="topnav" aria-label="Main">
          <NavLink to="/" end>Shop</NavLink>
          {user ? <NavLink to={user.role === "employee" ? "/staff" : "/account"}>{user.role === "employee" ? "Staff portal" : "Account"}</NavLink> : <NavLink to="/login">Log in</NavLink>}
          {user && <button className="linkbtn" onClick={signOut}>Log out</button>}
        </nav>
        <div className="tools">
          <Link to="/cart" className="bagbtn" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
            <Icon name="bag" />
            {count > 0 && <span className="count">{count}</span>}
          </Link>
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="footer">
        <div className="wrap foot-grid">
          <div>
            <Link to="/" className="logo"><span className="logo-mark" aria-hidden="true">S</span>Storefront</Link>
            <p className="muted">Everyday goods for your home, your desk and your day.</p>
          </div>
          <nav aria-label="Shop">
            <h3>Shop</h3>
            <Link to="/">All products</Link>
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
        <Link to={homeFor("employee")} className="logo"><span className="logo-mark" aria-hidden="true">S</span>Storefront</Link>
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
