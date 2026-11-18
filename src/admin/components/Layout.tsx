import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useLoadCatalog } from "../../shared/hooks/useCatalog";
import { useLoadOrders } from "../../shared/hooks/useOrders";
import { Avatar, Icon, LoadGate, Logo, Menu } from "../../shared/ui";
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
    <div className="grid min-h-screen grid-cols-[236px_minmax(0,1fr)] max-[900px]:block">
      <aside className="sticky top-0 flex h-screen flex-col items-start gap-3.5 self-start border-r border-line bg-white px-3.5 py-5 max-[900px]:static max-[900px]:h-auto max-[900px]:flex-row max-[900px]:flex-wrap max-[900px]:items-center max-[900px]:gap-x-3 max-[900px]:gap-y-2 max-[900px]:border-r-0 max-[900px]:border-b max-[900px]:px-4 max-[900px]:pt-2.5 max-[900px]:pb-0">
        <Logo to="/admin" label="Everyday Market" className="px-2 pb-2 max-[900px]:p-0" />
        <nav className="mt-2 flex flex-col gap-0.5 self-stretch max-[900px]:order-3 max-[900px]:mt-0 max-[900px]:flex-[1_1_100%] max-[900px]:flex-row max-[900px]:gap-1 max-[900px]:overflow-x-auto max-[900px]:[scrollbar-width:none]" aria-label="Admin">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={"end" in n} className="flex items-center gap-3 rounded-lg px-3 py-[9px] font-[550] text-ink-2 no-underline hover:bg-soft aria-[current=page]:bg-brand-tint aria-[current=page]:text-forest max-[900px]:flex-none max-[900px]:rounded-b-none max-[900px]:py-2"><Icon name={n.icon} className="size-5" /><span>{n.label}</span></NavLink>
          ))}
        </nav>
        {sampleData && <p className="mx-2 mt-auto text-[12.5px] text-muted max-[900px]:hidden">Showing sample data. Add your API URL to use real data.</p>}
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-[15] flex items-center justify-end gap-[18px] border-b border-line bg-white px-7 py-2.5 max-[900px]:static max-[900px]:px-4 max-[900px]:py-2">
          <Link to="/" className="link font-[550]">View storefront</Link>
          <Menu label="Account menu" trigger={<Avatar letter={user?.name[0]?.toUpperCase()} />}>
            {(close) => (
              <>
                <div className="mb-1 flex flex-col border-b border-line px-3 pt-2.5 pb-3"><strong>{user?.name}</strong><span className="text-muted">{user?.email}</span></div>
                <button role="menuitem" onClick={() => { close(); signOut(); navigate("/admin/login"); }}>Log out</button>
              </>
            )}
          </Menu>
        </header>
        <main className="mx-auto w-full max-w-[1240px] min-w-0 px-7 pt-7 pb-16 max-[900px]:px-4 max-[900px]:pt-5 max-[900px]:pb-12">
          <LoadGate status={status} error={catalog.error ?? orders.error} what="the dashboard data" onRetry={() => { catalog.reload(); orders.reload(); }}><Outlet /></LoadGate>
        </main>
      </div>
    </div>
  );
}
