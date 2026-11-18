import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { Icon, Logo, Menu } from "../../shared/ui";
import { useAdmin } from "../hooks/useAdmin";

const NAV = [
  { to: "/admin", label: "Overview", icon: "home", end: true },
  { to: "/admin/orders", label: "Orders", icon: "orders" },
  { to: "/admin/products", label: "Products", icon: "products" },
  { to: "/admin/import", label: "Import", icon: "upload" },
] as const;

/** Dashboard shell: a sidebar with the sections, a top bar with the account menu. On phones the sidebar becomes a row at the top. */
export function AdminLayout() {
  const { user, signOut } = useAdmin();
  const navigate = useNavigate();
  return (
    <div className="admin">
      <aside className="sidebar">
        <Logo to="/admin" label="Everyday Market" />
        <span className="pill">Admin portal</span>
        <nav aria-label="Admin">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={"end" in n}><Icon name={n.icon} /><span>{n.label}</span></NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-content">
        <header className="atop">
          <Link to="/" className="link store-link">View storefront</Link>
          <Menu label="Account menu" trigger={<span className="avatar">{user?.name[0]?.toUpperCase()}</span>}>
            {(close) => (
              <>
                <div className="dd-head"><strong>{user?.name}</strong><span className="muted">{user?.email}</span></div>
                <button role="menuitem" onClick={() => { close(); signOut(); navigate("/admin/login"); }}>Log out</button>
              </>
            )}
          </Menu>
        </header>
        <main className="admin-main"><Outlet /></main>
      </div>
    </div>
  );
}
