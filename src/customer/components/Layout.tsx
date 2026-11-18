import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useLoadCatalog } from "../../shared/hooks/useCatalog";
import { Avatar, Icon, LoadGate, Logo, Menu, ThemeToggle } from "../../shared/ui";
import { WRAP } from "../ui";
import { useAppSelector } from "../store/typedHooks";
import { useCustomer } from "../hooks/useCustomer";
import { useAuthDialog } from "./AuthDialog";
import { useCart } from "../hooks/useCart";
import { useCategories } from "../hooks/useCategories";
import { CategoryCard } from "./parts";

const DD_HEAD = "mb-1 flex flex-col border-b border-line px-3 pt-2.5 pb-3";
const NAV_LINK = "inline-flex h-10 items-center border-y-2 border-transparent font-[550] text-muted no-underline hover:text-ink aria-[current=page]:border-b-brand aria-[current=page]:text-ink";

function AccountMenu() {
  const { user, signOut } = useCustomer();
  const authDialog = useAuthDialog();
  return (
    <Menu label="Account menu" trigger={<Avatar letter={user?.name[0]?.toUpperCase()} />}>
      {(close) =>
        user ? (
          <>
            <div className={DD_HEAD}><strong>{user.name}</strong><span className="text-muted">{user.email}</span></div>
            <Link role="menuitem" to="/orders" onClick={close}>My orders</Link>
            <Link role="menuitem" to="/account" onClick={close}>My account</Link>
            <button role="menuitem" onClick={() => { close(); signOut(); }}>Log out</button>
          </>
        ) : (
          <>
            <div className={DD_HEAD}><strong>Welcome</strong><span className="text-muted">Log in to place and track orders.</span></div>
            <button role="menuitem" className="dd-primary" onClick={() => { close(); authDialog.open({ mode: "login" }); }}>Log in</button>
            <button role="menuitem" onClick={() => { close(); authDialog.open({ mode: "signup" }); }}>Create account</button>
          </>
        )
      }
    </Menu>
  );
}

/** Card-based Categories dropdown next to Retail and Bulk orders. */
function CategoriesMenu() {
  const { pathname } = useLocation();
  const channel = pathname.startsWith("/bulk") ? "bulk" : "retail";
  const categories = useCategories(channel);
  return (
    <Menu
      label="Categories" kind="panel" wrapperClass="static"
      buttonClass={`group ${NAV_LINK.replace("inline-flex h-10 items-center border-y-2", "inline-flex h-10 items-center gap-1 border-y-2 bg-transparent p-0").replace("aria-[current=page]:border-b-brand aria-[current=page]:text-ink", "aria-expanded:border-b-brand aria-expanded:text-ink")}`}
      // anchored to the header, not the button, so it never runs off the right edge
      panelClass="left-7 right-auto w-[min(760px,calc(100%-56px))] rounded-2xl p-[18px] max-sm:left-3 max-sm:right-3 max-sm:w-auto max-sm:p-3.5"
      trigger={<>Categories <Icon name="chevD" className="size-4 transition-transform group-aria-expanded:rotate-180" /></>}
    >
      {(close) => (
        <>
          <div className="mb-3.5 flex items-baseline justify-between gap-3">
            <strong className="text-base">{channel === "bulk" ? "Bulk packs by category" : "Shop by category"}</strong>
            <Link to={channel === "bulk" ? "/categories?channel=bulk" : "/categories"} className="link" onClick={close}>See all categories</Link>
          </div>
          <div className="grid grid-cols-4 gap-3 max-sm:grid-cols-2 max-sm:gap-2.5">
            {categories.map((c) => <CategoryCard key={c.name} name={c.name} count={c.count} cover={c.cover} to={c.to} onClick={close} shape="compact" />)}
          </div>
        </>
      )}
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
    <form className="relative m-0 flex-[0_1_300px] max-[1000px]:order-3 max-[1000px]:min-w-0 max-[1000px]:flex-[1_1_260px] max-sm:basis-full" role="search" onSubmit={(e) => e.preventDefault()}>
      <Icon name="search" className="pointer-events-none absolute top-[9px] left-3 size-5 text-muted" />
      <input
        type="search"
        className="rounded-full border-edge-soft pl-[38px]"
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
  const catalog = useLoadCatalog();
  const sampleData = useAppSelector((s) => Object.values(s.meta.sources).includes("mock"));
  return (
    <>
      <header className="sticky top-0 z-10 flex items-center gap-7 border-b border-line bg-surface/[.97] px-7 py-3 backdrop-blur-sm max-[1000px]:relative max-[1000px]:flex-wrap max-[1000px]:gap-x-5 max-[1000px]:gap-y-3 max-sm:px-4 max-sm:py-2.5">
        <Logo to="/" label="Everyday Market" />
        <HeaderSearch />
        <nav className="flex items-center gap-[22px] max-[1000px]:order-4 max-[1000px]:flex-none max-sm:flex-[1_1_100%] max-sm:overflow-x-auto max-sm:border-t max-sm:border-line max-sm:pt-1 max-sm:[scrollbar-width:none]" aria-label="Main">
          <NavLink to="/" end className={NAV_LINK}>Retail</NavLink>
          <NavLink to="/bulk" className={NAV_LINK}>Bulk orders</NavLink>
          <CategoriesMenu />
        </nav>
        <div className="ml-auto flex items-center gap-3.5">
          <Link to="/cart" className="inline-flex h-10 items-center gap-2 font-[550] no-underline" aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}>
            <Icon name="bag" className="text-brand" />
            <span><span className="max-sm:hidden">Cart </span>({count})</span>
          </Link>
          <ThemeToggle />
          <AccountMenu />
        </div>
      </header>
      <main>
        <LoadGate status={catalog.status} error={catalog.error} what="the store" onRetry={catalog.reload}><Outlet /></LoadGate>
      </main>
      <footer className="mt-6 border-t border-line py-5 text-[13px]">
        <div className={`${WRAP} flex flex-wrap items-center justify-between gap-x-6 gap-y-2 max-sm:flex-col max-sm:items-start`}>
          <span>© {new Date().getFullYear()} Everyday Market</span>
          {sampleData && <span className="text-muted">Demo storefront. No real orders or payments.</span>}
        </div>
      </footer>
    </>
  );
}
