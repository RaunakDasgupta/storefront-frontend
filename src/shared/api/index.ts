// Builds the data layer. Each resource (products, orders, sign-in, payments, import) uses your API when it has a URL and
// the built-in sample data when it does not, so you can connect them one at a time. See .env.example.
import { resolveEndpoints, type ApiEnv } from "./config.ts";
import { createHttp, type HttpOptions } from "./http.ts";
import { httpAdminAuth, httpCustomerAuth, httpImporter, httpOrders, httpPayments, httpProducts } from "./httpApi.ts";
import { createMockApi, type MockOptions } from "./mock.ts";
import type { Api, ResourceName, Sources } from "./types.ts";
import type { KV } from "./kv.ts";

export type CreateApiOptions = HttpOptions & { env: ApiEnv; mockStorage?: KV; mock?: MockOptions };

export function createApi({ env, mockStorage, mock, ...httpOptions }: CreateApiOptions): Api {
  const urls = resolveEndpoints(env);
  const http = createHttp(httpOptions);
  const sample = createMockApi(mockStorage, mock);
  const sources = Object.fromEntries((["products", "orders", "customerAuth", "adminAuth", "payments", "importer"] as ResourceName[]).map((n) => [n, urls[n] ? "api" : "mock"])) as Sources;

  return {
    products: urls.products ? httpProducts(http, urls.products) : sample.products,
    orders: urls.orders ? httpOrders(http, urls.orders) : sample.orders,
    customerAuth: urls.customerAuth ? httpCustomerAuth(http, urls.customerAuth) : sample.customerAuth,
    adminAuth: urls.adminAuth ? httpAdminAuth(http, urls.adminAuth) : sample.adminAuth,
    payments: urls.payments ? httpPayments(http, urls.payments) : sample.payments,
    importer: urls.importer ? httpImporter(http, urls.importer) : sample.importer,
    sources,
  };
}

export type { Api } from "./types.ts";
