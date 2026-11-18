import { CartPanel } from "../components/parts";
import { PAGE_NARROW } from "../ui";

/** Full-page cart, reached from the header (the Retail and Bulk pages show it beside the products). */
export function CartPage() {
  return (
    <div className={PAGE_NARROW}>
      <CartPanel />
    </div>
  );
}
