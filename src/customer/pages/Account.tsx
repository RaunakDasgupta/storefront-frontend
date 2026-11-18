import { Link } from "react-router-dom";
import { useCustomer } from "../hooks/useCustomer";
import { H1, PAGE_NARROW } from "../ui";

export function Account() {
  const { user, signOut } = useCustomer();
  return (
    <div className={PAGE_NARROW}>
      <h1 className={H1}>Hi, {user?.name.split(" ")[0]}</h1>
      <section className="mt-4 mb-5 flex flex-wrap items-center gap-x-9 gap-y-4 rounded-xl bg-surface px-5 py-[18px] shadow-[0_0_0_1px_rgba(0,0,0,.07),0_1px_2px_rgba(0,0,0,.05)]">
        <div><p className="text-muted">Name</p><strong>{user?.name}</strong></div>
        <div><p className="text-muted">Email</p><strong>{user?.email}</strong></div>
        <Link to="/orders" className="btn btn-primary btn-inline ml-auto max-sm:ml-0 max-sm:flex-1">My orders</Link>
        <button className="btn btn-secondary btn-inline ml-auto max-sm:ml-0 max-sm:flex-1" onClick={signOut}>Log out</button>
      </section>
    </div>
  );
}
