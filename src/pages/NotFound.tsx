import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="empty">
      <h1>Page not found</h1>
      <p className="muted">That page doesn't exist or has moved.</p>
      <Link to="/" className="btn primary inline">Back to the store</Link>
    </div>
  );
}
