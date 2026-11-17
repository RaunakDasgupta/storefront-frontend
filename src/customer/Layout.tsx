import { Link, Outlet, useLocation } from "react-router-dom";
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
            <Link role="menuitem" to="/account" onClick={close}>My account</Link>
            <button role="menuitem" onClick={() => { close(); signOut(); }}>Log out</button>
          </>
        ) : (
          <>
            <div className="dd-head"><strong>Welcome</strong><span className="muted">Log in to see your orders.</span></div>
            <Link role="menuitem" className="dd-primary" to="/login" onClick={close}>Log in</Link>
            <Link role="menuitem" to="/signup" onClick={close}>Create account</Link>
          </>
        )
      }
    </Menu>
  );
}

export function CustomerLayout() {
  const { count } = useCart();
  const { user } = useCustomer();
  const { pathname, search } = useLocation();
  const onSale = new URLSearchParams(search).get("sale") === "1";
  const inShop = pathname === "/shop";

  return (
    <>
      <header className="topbar">
        <Logo to="/" label="Storefront" />
        <nav className="topnav" aria-label="Main">
          <Link to="/shop" className={inShop && !onSale ? "active" : ""}>Shop</Link>
          <Link to="/shop?sale=1" className={inShop && onSale ? "active" : ""}>Sale</Link>
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
        <div className="wrap foot-row">
          <Logo to="/" label="Storefront" />
          <nav aria-label="Footer">
            <Link to="/shop">Shop</Link>
            <Link to="/cart">Cart</Link>
            {user ? <Link to="/account">Account</Link> : <Link to="/login">Log in</Link>}
          </nav>
        </div>
        <p className="wrap copy">© {new Date().getFullYear()} Storefront</p>
      </footer>
    </>
  );
}
