import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "./auth";
import { useCart } from "./cart";
import { money, type Product } from "./data";

/** Gradient placeholder until real product photos exist. */
export function ProductImage({ p }: { p: Product }) {
  return (
    <div className="pimg" style={{ background: `linear-gradient(135deg, hsl(${p.hue} 65% 88%), hsl(${p.hue} 55% 68%))` }} aria-hidden="true">
      {p.name[0]}
    </div>
  );
}

export function ProductCard({ p }: { p: Product }) {
  const { add } = useCart();
  return (
    <article className="pcard">
      <Link to={`/products/${p.id}`} className="pcard-link">
        <ProductImage p={p} />
        <h3>{p.name}</h3>
        <p className="muted">{money(p.price)}</p>
      </Link>
      <button className="btn secondary inline" disabled={p.stock === 0} onClick={() => add(p.id)}>
        {p.stock === 0 ? "Sold out" : "Add to cart"}
      </button>
    </article>
  );
}

export function StoreLayout() {
  const { user, signOut } = useAuth();
  const { count } = useCart();
  return (
    <>
      <header className="topbar">
        <Link to="/" className="brand"><span className="brand-mark" aria-hidden="true">S</span>Storefront</Link>
        <nav className="topnav" aria-label="Main">
          <NavLink to="/" end>Shop</NavLink>
          <NavLink to="/cart">Cart ({count})</NavLink>
          {user?.role === "employee" && <NavLink to="/staff">Staff portal</NavLink>}
          {user?.role === "customer" && <NavLink to="/account">Account</NavLink>}
          {user ? <button className="linkbtn" onClick={signOut}>Sign out</button> : <NavLink to="/login">Sign in</NavLink>}
        </nav>
      </header>
      <main className="page"><Outlet /></main>
      <footer className="footer">
        <p>© {new Date().getFullYear()} Storefront. Everyday goods, made to last.</p>
      </footer>
    </>
  );
}

export function StaffLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="admin">
      <aside className="side">
        <Link to="/staff" className="brand"><span className="brand-mark" aria-hidden="true">S</span>Staff</Link>
        <nav aria-label="Staff">
          <NavLink to="/staff" end>Overview</NavLink>
          <NavLink to="/staff/orders">Orders</NavLink>
          <NavLink to="/staff/products">Products</NavLink>
        </nav>
        <div className="side-foot">
          <p className="muted">Signed in as {user?.name}</p>
          <Link to="/" className="link">View store</Link>
          <button className="linkbtn" onClick={() => { signOut(); navigate("/login"); }}>Sign out</button>
        </div>
      </aside>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}
