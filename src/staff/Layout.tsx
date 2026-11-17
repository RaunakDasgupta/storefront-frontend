import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Icon, Logo, Menu } from "../shared/ui";
import { useStaff } from "./auth";

const NAV = [
  { to: "/staff", label: "Overview", icon: "home", end: true },
  { to: "/staff/orders", label: "Orders", icon: "orders" },
  { to: "/staff/products", label: "Products", icon: "products" },
  { to: "/staff/import", label: "Import", icon: "upload" },
] as const;

/** Top bar with the account menu, a left sidebar on desktop and a bottom tab bar on phones. */
export function StaffLayout() {
  const { user, signOut } = useStaff();
  const navigate = useNavigate();
  return (
    <div className="admin">
      <header className="atop">
        <Logo to="/staff" label="Everyday Market Staff" />
        <Menu label="Account menu" trigger={<span className="avatar">{user?.name[0]?.toUpperCase()}</span>}>
          {(close) => (
            <>
              <div className="dd-head"><strong>{user?.name}</strong><span className="muted">{user?.email}</span></div>
              <button role="menuitem" onClick={() => { close(); signOut(); navigate("/staff/login"); }}>Log out</button>
            </>
          )}
        </Menu>
      </header>
      <nav className="side" aria-label="Staff">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} end={"end" in n}><Icon name={n.icon} /><span>{n.label}</span></NavLink>
        ))}
      </nav>
      <main className="admin-main"><Outlet /></main>
    </div>
  );
}
