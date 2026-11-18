import { Link } from "react-router-dom";
import { useCustomer } from "../hooks/useCustomer";

export function Account() {
  const { user, signOut } = useCustomer();
  return (
    <div className="wrap page narrow">
      <h1>Hi, {user?.name.split(" ")[0]}</h1>
      <section className="cardbox profile">
        <div><p className="muted">Name</p><strong>{user?.name}</strong></div>
        <div><p className="muted">Email</p><strong>{user?.email}</strong></div>
        <Link to="/orders" className="btn primary inline">My orders</Link>
        <button className="btn secondary inline" onClick={signOut}>Log out</button>
      </section>
    </div>
  );
}
