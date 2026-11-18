import { useOrders } from "../../shared/hooks/useOrders";
import { useCustomer } from "./useCustomer";

/** The signed-in customer's own orders, newest first (the shared store holds everyone's). */
export function useMyOrders() {
  const { orders } = useOrders();
  const { user } = useCustomer();
  const email = user?.email.toLowerCase();
  return email ? orders.filter((o) => o.customer.email.toLowerCase() === email) : [];
}
