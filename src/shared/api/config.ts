// Where the real API lives. Set these in .env.local (see .env.example); anything left unset uses the built-in sample data.
import type { ResourceName } from "./types.ts";

export type ApiEnv = Record<string, string | undefined>;

/** Each resource's default path under VITE_API_URL, and the variable that overrides its full URL. */
const RESOURCES: Record<ResourceName, { path: string; variable: string }> = {
  products: { path: "/products", variable: "VITE_PRODUCTS_URL" },
  orders: { path: "/orders", variable: "VITE_ORDERS_URL" },
  customerAuth: { path: "/auth", variable: "VITE_CUSTOMER_AUTH_URL" },
  adminAuth: { path: "/admin/auth", variable: "VITE_ADMIN_AUTH_URL" },
  payments: { path: "/payments", variable: "VITE_PAYMENTS_URL" },
  importer: { path: "/import", variable: "VITE_IMPORT_URL" },
};

const clean = (v: string | undefined) => v?.trim().replace(/\/+$/, "") || undefined;

/** The URL for each resource that has one. A resource without a URL is served by the mock. */
export function resolveEndpoints(env: ApiEnv): Partial<Record<ResourceName, string>> {
  const base = clean(env.VITE_API_URL);
  const urls: Partial<Record<ResourceName, string>> = {};
  for (const [name, { path, variable }] of Object.entries(RESOURCES) as [ResourceName, (typeof RESOURCES)[ResourceName]][]) {
    const url = clean(env[variable]) ?? (base ? `${base}${path}` : undefined);
    if (url) urls[name] = url;
  }
  return urls;
}
