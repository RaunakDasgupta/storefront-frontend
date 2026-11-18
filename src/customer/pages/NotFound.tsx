import { Link } from "react-router-dom";
import { H1 } from "../ui";

export function NotFound() {
  return (
    <div className="mx-auto max-w-[1240px] py-10 text-center max-sm:px-4">
      <h1 className={H1}>Page not found</h1>
      <p className="text-muted">That page doesn't exist or has moved.</p>
      <Link to="/" className="btn btn-primary btn-inline mt-4">Back to the shop</Link>
    </div>
  );
}
