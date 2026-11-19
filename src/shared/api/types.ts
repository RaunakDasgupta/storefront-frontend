// The data layer's contract. Components and slices only know these interfaces. Each one has a mock version (sample
// data kept in this browser) and an HTTP version (your real API); see ./index.ts for how one is picked.
// Types only: no runtime code, so this file loads anywhere.
import type { ParseResult, SkuRow } from "../lib/csv.ts";
import type { Channel, Product } from "../lib/data.ts";
import type { Address, Order, OrderItem } from "../lib/orderlogic.ts";
import type { NewProduct, ProductEdit } from "../lib/productform.ts";

export type User = { name: string; email: string };
/** What signing in returns. `token` is sent as `Authorization: Bearer <token>` on later requests; mock sign-ins have none. */
export type Session = { user: User; token?: string };

export type Card = { number: string; name: string; expiry: string; cvc: string };
export type PaymentResult = { ok: true; ref: string } | { ok: false; message: string };

export type NewOrders = {
  customer: Order["customer"];
  shipping: Address;
  /** The reference the payment returned, so the server can check the order was paid for. */
  paymentRef: string;
  /** Retail and bulk items are fulfilled separately: one group, and so one order, per channel. */
  groups: { channel: Channel; items: OrderItem[] }[];
};

export interface ProductsApi {
  list(): Promise<Product[]>;
  /** Adds one product and returns it with its id. Rejects if the SKU is already taken. */
  create(input: NewProduct): Promise<Product>;
  /** Returns the saved product (the SKU stays fixed). */
  update(id: string, edit: ProductEdit): Promise<Product>;
  remove(id: string): Promise<void>;
  /** Undo for `remove`. `index` is where it was in the list; a server may ignore it. */
  restore(product: Product, index: number): Promise<Product>;
  /** Checks a catalog sheet (.csv, and .xlsx where the server supports it) without saving anything: the rows that passed, and the problem rows. */
  validateFile(file: File): Promise<ParseResult>;
  /** Adds new SKUs and updates existing ones, matched by SKU. Never deletes. */
  importRows(rows: SkuRow[]): Promise<{ added: number; updated: number }>;
  /** Back to the sample products. Only the mock has it. */
  reset?(): Promise<void>;
}

export interface OrdersApi {
  /** A customer gets their own orders, an admin gets everyone's (the server decides from the token). */
  list(): Promise<Order[]>;
  /** One order per group that has items; the server assigns the ids. */
  create(input: NewOrders): Promise<Order[]>;
  setStep(id: string, step: number): Promise<Order>;
  remove(id: string): Promise<void>;
  /** Undo for `remove`. */
  restore(order: Order, index: number): Promise<Order>;
}

export interface CustomerAuthApi {
  signIn(input: { email: string; password: string }): Promise<Session>;
  signUp(input: { name: string; email: string; password: string }): Promise<Session>;
}
export interface AdminAuthApi {
  /** `identity` is a work email or an employee ID. */
  signIn(input: { identity: string; password: string }): Promise<Session>;
}

export interface PaymentsApi {
  /** A declined payment resolves with `ok: false`; only a failure to reach the gateway rejects. */
  charge(input: { amount: number; card: Card }): Promise<PaymentResult>;
}

export interface ImportApi {
  /** Reads SKU rows from a database or cloud source. `settings` are the connection form's values. */
  connect(input: { connector: string; service: string; settings: Record<string, string> }): Promise<SkuRow[]>;
}

export type ResourceName = "products" | "orders" | "customerAuth" | "adminAuth" | "payments" | "importer";
/** "api" when that resource talks to your server, "mock" when it uses the built-in sample data. */
export type Sources = Record<ResourceName, "api" | "mock">;

export type Api = {
  products: ProductsApi;
  orders: OrdersApi;
  customerAuth: CustomerAuthApi;
  adminAuth: AdminAuthApi;
  payments: PaymentsApi;
  importer: ImportApi;
  sources: Sources;
};

/** What every thunk receives as its third argument. */
export type ThunkExtra = { api: Api };
