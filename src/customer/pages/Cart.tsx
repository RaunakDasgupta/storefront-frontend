import { CartPanel } from "../parts";

/** Full-page cart, reached from the header (the Retail and Bulk pages show it beside the products). */
export function CartPage() {
  return (
    <div className="wrap page narrow">
      <CartPanel />
    </div>
  );
}
