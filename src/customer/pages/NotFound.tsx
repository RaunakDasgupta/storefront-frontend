import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="wrap page empty">
      <h1>Page not found</h1>
      <p className="muted">That page doesn't exist or has moved.</p>
      <Link to="/shop" className="btn primary inline">Back to the shop</Link>
    </div>
  );
}
