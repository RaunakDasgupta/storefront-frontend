import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useLoadCatalog } from "../../shared/hooks/useCatalog";
import { useLoadOrders } from "../../shared/hooks/useOrders";
import { Icon, LoadGate, Logo, Menu } from "../../shared/ui";
import { useAdmin } from "../hooks/useAdmin";
import { useAppSelector } from "../store/typedHooks";

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
  // every admin screen needs both lists, so they load together
  const catalog = useLoadCatalog();
  const orders = useLoadOrders();
  const sampleData = useAppSelector((s) => Object.values(s.meta.sources).includes("mock"));
  const status = catalog.status === "failed" || orders.status === "failed" ? "failed" : catalog.status === "ready" && orders.status === "ready" ? "ready" : "loading";
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
        {sampleData && <p className="side-note muted">Showing sample data. Add your API URL to use real data.</p>}
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
        <main className="admin-main">
          <LoadGate status={status} error={catalog.error ?? orders.error} what="the dashboard data" onRetry={() => { catalog.reload(); orders.reload(); }}><Outlet /></LoadGate>
        </main>
      </div>
    </div>
  );
}
