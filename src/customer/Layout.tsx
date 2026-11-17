import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Icon, Logo, Menu } from "../shared/ui";
import { useCustomer } from "./auth";
import { useCart } from "./cart";

function AccountMenu() {
  const { user, signOut } = useCustomer();
  return (
    <Menu label="Account menu" trigger={<span className={user ? "avatar" : "avatar blank"}>{user?.name[0]?.toUpperCase()}</span>}>
      {(close) =>
        user ? (
          <>
            <div className="dd-head"><strong>{user.name}</strong><span className="muted">{user.email}</span></div>
            <Link role="menuitem" to="/orders" onClick={close}>My orders</Link>
            <Link role="menuitem" to="/account" onClick={close}>My account</Link>
            <button role="menuitem" onClick={() => { close(); signOut(); }}>Log out</button>
          </>
        ) : (
          <>
            <div className="dd-head"><strong>Welcome</strong><span className="muted">Log in to place and track orders.</span></div>
            <Link role="menuitem" className="dd-primary" to="/login" onClick={close}>Log in</Link>
            <Link role="menuitem" to="/signup" onClick={close}>Create account</Link>
          </>
        )
      }
    </Menu>
  );
}

/** Search box in the header. It filters the page you are on (Retail or Bulk orders), or jumps to Retail. */
function HeaderSearch() {
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const target = pathname === "/bulk" ? "/bulk" : "/";
  const q = pathname === target ? new URLSearchParams(search).get("q") ?? "" : "";
  return (
    <form className="search" role="search" onSubmit={(e) => e.preventDefault()}>
      <Icon name="search" />
      <input
        type="search"
        aria-label="Search products"
        placeholder="Search products"
        value={q}
        onChange={(e) => navigate(e.target.value ? `${target}?q=${encodeURIComponent(e.target.value)}` : target, { replace: pathname === target })}
      />
    </form>
  );
}

export function CustomerLayout() {
  const { count } = useCart();
  return (
    <>
      <header className="topbar">
        <Logo to="/" label="Everyday Market" />
        <HeaderSearch />
        <nav className="topnav" aria-label="Main">
          <NavLink to="/" end>Retail</NavLink>
          <NavLink to="/bulk">Bulk orders</NavLink>
        </nav>
        <div className="tools">
          <Link to="/cart" className="cartlink" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
            <Icon name="bag" />
            <span><span className="cart-word">Cart </span>({count})</span>
          </Link>
          <AccountMenu />
        </div>
      </header>
      <main><Outlet /></main>
      <footer className="footer">
        <div className="wrap foot-row">
          <span>© {new Date().getFullYear()} Everyday Market</span>
          <span className="muted">Demo storefront. No real orders or payments.</span>
        </div>
      </footer>
    </>
  );
}
