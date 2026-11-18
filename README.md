# storefront-frontend

Two independent apps in one **React 19 + TypeScript + Vite + Redux Toolkit** project, built around keeping each flow short and easy to navigate:

- **Customer storefront ("Everyday Market")** at `/`: retail and bulk shopping, a cart with a simulated checkout, and order-progress tracking.
- **Admin portal ("Everyday Market Admin")** at `/admin`: a dashboard, orders (with each delivery address), products, and SKU import from CSV, PostgreSQL, SQLite, AWS or Google Cloud.

The two apps have their own logins, sessions, route guards, layouts and stylesheets. Neither links to the other, being signed in to one never signs you in to the other, and each is built and loaded as a separate bundle.

## Getting started

Requires Node.js 22.18+ (the tests run TypeScript directly).

```bash
npm install
npm run dev
```

Then open http://localhost:5173 (customer) or http://localhost:5173/admin (admin).

| Script              | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the Vite dev server             |
| `npm run build`     | Typecheck, then build into `dist/`    |
| `npm run preview`   | Serve the production build locally    |
| `npm run typecheck` | Run `tsc` without emitting files      |
| `npm test`          | Run the unit tests (`src/**/*.test.ts`) |
| `npm run check`     | Typecheck, run the tests and build. Run it after every change |

## Demo logins

Each app has its own login. The customer login is a popup and the admin login is a page. Both show these (with a Fill in button) in `npm run dev`; production builds hide them.

| App      | Log in at      | Email / ID                                         | Password      |
| -------- | -------------- | -------------------------------------------------- | ------------- |
| Customer | popup (or `/login`) | `customer@storefront.test`                         | `customer123` |
| Admin    | `/admin/login` | `admin@storefront.test` or employee ID `EMP-1001`  | `admin1234`   |

Customer credentials do not work on the admin login, and the other way round. New customer accounts from `/signup` are kept in the browser's `localStorage`. Admin accounts are provisioned, so there is no admin sign-up.

## Customer storefront

The design follows the "Everyday Market" reference: green theme, search in the header, Retail / Bulk orders tabs, product cards with stock and price, the cart beside the products, a bulk banner and an order-progress tracker.

| Route                | What it does                                                                       |
| -------------------- | ---------------------------------------------------------------------------------- |
| `/`                  | Retail: intro, a banner to Bulk orders, a Featured row, a Browse by category grid, a See all categories button and the cart panel |
| `/categories`        | All categories as cards in a 3 x 2 grid that scrolls sideways (`/categories?channel=bulk` for Bulk orders) |
| `/bulk`              | Bulk orders: the same layout as Retail (banner to Retail, Featured, Browse by category) for cartons and pallets |
| `/orders`            | My orders: a card per order with its type, date, item photos, total, status, a progress tracker, an expandable item list and **Order again**; filter by All, Retail or Bulk (log in required) |
| `/cart`              | The cart as its own page (used on phones)                                          |
| `/products/:id`      | Product page                                                                       |
| `/login`             | Opens the log in popup over the landing page (old link; protected pages do the same) |
| `/account`           | Profile (log in required)                                                          |

- **Categories dropdown:** next to Retail and Bulk orders in the header, **Categories** opens a card-based dropdown (for the channel you are on) with a photo card per category (7 so far: Home care, Personal care, Paper essentials, Kitchen essentials, Baby care, Pet care, Snacks & drinks) and a **See all categories** link. A card opens that category's full list (`/?category=Home%20care`).
- **Landing page (Retail and Bulk orders share it):** a banner to the other channel, a Featured row of up to 5 scrollable products (arrow buttons on desktop, swipe on touch) with a **See more** tile, then **Browse by category**: a row of category tabs above one product grid. Choosing a tab swaps the products in that same grid in place (no page change, arrow keys move between tabs), with a link to that category's full list. A **See all categories** button opens `/categories`. Featured's **See all** opens the full list (`/?view=all`), and **Back to featured** returns. A search from the header also shows the full list.
- **Search** is in the header and filters the page you are on (`/?q=soap`, `/bulk?q=carton`). A category uses `?category=`.
- **Demo checkout:** the cart's **Checkout** button needs a log in. If you are logged out, a **login popup** opens right over the cart (no page change): log in, or switch to **Create an account** in the same popup, and the checkout popup opens next. Checkout is a short popup flow: **1. Delivery address** (name, mobile number, address, city, state, 6-digit PIN code), **2. Payment** with a **dummy payment gateway**, then an **Order placed** popup showing the order number(s), the amount paid, a payment reference and where it is going, with **View order** and **Continue shopping** buttons. No real payment is taken and no network call is made: use the test card `4242 4242 4242 4242` with any future expiry and any security code (the **Fill in test card** button does this), or `4000 0000 0000 0002` to see a declined payment. Card numbers are checked (Luhn), and card details are never stored: they stay in the payment form. The delivery address is saved on each order and shown on the **Orders** page (orders placed before this existed have none). Paying creates an order (`ORD_1002`, ...) at **Confirmed** and clears the cart. A cart with both retail and bulk items becomes **two orders** (one per channel), because they are fulfilled separately, paid in one payment. The demo customer's sample order, `ORD_1001`, is at **Preparing**. Customers only see their own orders. The same orders appear in the admin portal. Orders only move forward when admins change their status (see below).
- **Log in and sign up are popups, not pages.** The profile avatar is blank when logged out and its menu opens the same popup in Log in or Create account mode (with a link to switch between them), as do checkout and protected pages such as My orders (a logged-out visitor lands on the landing page with the popup open and returns to the page after logging in). The old `/login` and `/signup` addresses still work: they open the popup over the landing page. Once you are logged in it shows your initial and the menu lists **My orders**, **My account** and **Log out**. There is no My orders tab in the header.

## Admin portal

| Route             | What it does                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `/admin`          | **Dashboard**: revenue, orders, average order and orders still to fulfil; a **Revenue by day** bar chart (hover a day for its numbers); **Orders by status**; the 8 newest orders in a table (each links to that order in the Orders list); and the products running low on stock. |
| `/admin/orders`   | Every order placed in the storefront (with the **delivery address** and phone number the customer entered at checkout, which search also matches; orders from before checkout asked for one say so) as cards in a 3 x 2 grid that scrolls sideways, with **Retail orders** and **Bulk orders** on separate tabs (`?type=bulk`), status tabs (All, Confirmed, Preparing, Packed, Ready for dispatch) and search. **Admins change an order's status from the dropdown on its card**, and the customer's tracker updates (live if the storefront is open in another tab). **Delete** asks first, removes the order from the portal and from the customer's My orders, and a notice offers **Undo** for 10 seconds. |
| `/admin/products` | Products as **editable, deletable cards** in the same 3 x 2 grid that scrolls sideways (photo, name and size, SKU and category, stock, price), with **Retail products** and **Bulk products** on separate tabs (`?type=bulk`), a low-stock filter and search. **Edit** opens a dialog for the name, size, category, type, price, compare-at price, stock, description and photo link (the SKU stays fixed). **Delete** asks first, removes the product from the storefront, and a notice offers **Undo** for 10 seconds. Orders that already include a deleted product keep their items. **Reset catalog** brings back the samples. |
| `/admin/import`   | Import SKUs from a CSV file, PostgreSQL, SQLite, AWS (S3 or RDS) or Google Cloud (Cloud Storage, Cloud SQL or BigQuery). |
| `/admin/login`    | Admin log in                                                                               |

The admin portal is a dashboard: a **sidebar** with the four sections (Overview, Orders, Products, Import) and a top bar with a **View storefront** link and the account menu. It shares the storefront's colours and rounded style. On phones the sidebar becomes a row of sections at the top. The portal used to live at `/staff`; old `/staff` links redirect to `/admin`.

### Importing SKUs

On `/admin/import`, pick where the SKUs come from: **CSV file**, **PostgreSQL**, **SQLite**, **Amazon Web Services** (S3 bucket or RDS) or **Google Cloud** (Cloud Storage, Cloud SQL or BigQuery). Every source ends in the same preview and import. The database and cloud sources are **demos**: a browser cannot open a database connection, so **Connect and preview** only checks the form (required fields, port range) and loads sample products (four new SKUs and one update) so you can try the flow. Credentials stay in the form and are never saved or sent. A real connection needs a server-side import service; the connector settings in `src/admin/lib/connectors.ts` show what each source would need.

#### From a CSV file

Drop in a `.csv` file with one SKU per row. You see a preview (with the logos, and whether each row is new or an update) and a list of problem rows before anything changes. **Download CSV template** gives a working example.

| Column             | Required | Notes                                                         |
| ------------------ | -------- | ------------------------------------------------------------- |
| `sku`              | yes      | Unique key. An existing SKU is updated, a new one is added.   |
| `name`             | yes      | Up to 120 characters.                                         |
| `size`             | no       | Pack size shown under the name, for example `1 kg` or `Carton of 12`. |
| `price`            | yes      | Rupees, for example `1499` or `₹1,499`.                       |
| `category`         | no       | Defaults to `General`.                                        |
| `channel`          | no       | `retail` (default) or `bulk`. Bulk SKUs appear on the Bulk orders page. |
| `compare_at_price` | no       | Shown as the crossed-out price when higher than `price`.      |
| `stock`            | no       | Whole number, defaults to `0`.                                |
| `description`      | no       | Up to 500 characters. Blank keeps the current description.    |
| `logo_url`         | no       | Full `http(s)` link to the product logo or photo. Blank keeps the current image. |

Header names are case-insensitive, and `logo`, `image` and `image_url` also work for `logo_url`. Files are limited to 1 MB and 1,000 rows. Rows with problems are skipped and nothing is ever deleted. Imported SKUs appear in the storefront and the Products table straight away. They are stored in this browser's `localStorage`, and **Reset catalog** on the Products page restores the 28 sample products. Logo links load straight from the URL you give, so the image host must allow hotlinking; a broken link shows a placeholder icon.

## Prices and photos

Prices are in Indian rupees (₹), formatted with the `en-IN` locale (for example ₹1,23,456). Product photos are in `public/products/<product-id>.jpg` (900x900) with 200px versions in `public/products/thumbs/` for tables and the cart; bulk packs reuse the matching retail photo, and `bulk-cartons.jpg` is the banner. To change a photo, replace the file with the same name.

The photos are free stock images from [Unsplash](https://unsplash.com), used under the [Unsplash License](https://unsplash.com/license). They are placeholders: swap in your own product photography before launch.

## Project layout

```
src/main.tsx             Router entry
src/App.tsx              Loads the customer or admin app by URL (/admin/* is admin)
src/shared/              Only what both apps genuinely share
  api/                   The data layer: types.ts (the interfaces), http.ts + httpApi.ts (your server), mock.ts + mockAccounts.ts (sample data), config.ts (env URLs), index.ts (createApi), api.test.ts
  lib/                   Pure code with no React: data.ts, csv.ts, catalog.ts, orderlogic.ts, productform.ts (tests in lib.test.ts)
  store/                 Redux slices for the catalog, orders and meta (loading status, API thunks), session and typed-hook helpers, store.test.ts
  hooks/                 useCatalog and useOrders (plus useLoadCatalog / useLoadOrders): selectors plus dispatch for the components
  ui/                    Icon, Logo, ProductImage, Field, Menu, LoadGate (index.tsx) and base.css (colour tokens and primitives)
src/customer/            The storefront (its styles are scoped to .cx)
  store/                 Its own store, slices (auth, cart, toast, authDialog, checkout), checkout thunks, form checks (gateway.ts), store.test.ts
  hooks/                 useCustomer, useCart, useMyOrders, useCategories
  components/            Layout, AuthDialog, CheckoutDialog (address, dummy payment, order placed), Toast, parts (ProductCard, CartPanel and the other pieces)
  pages/                 Shop, Product, Categories, Cart, Orders, Account, NotFound
src/admin/               The admin portal (its styles are scoped to .ax)
  store/                 Its own store, auth slice and the import thunk
  hooks/                 useAdmin
  lib/                   connectors.ts: the database and cloud import sources (settings and checks; tests in connectors.test.ts)
  components/            Layout (sidebar shell), RequireAdmin, Charts, OrderGrid, ProductGrid, ProductEditor, ConfirmDelete, ScrollGrid, ImportPreview, ConnectorForm
  pages/                 Login, Overview, Orders, Products, Import
```

## State management

State lives in [Redux Toolkit](https://redux-toolkit.js.org). Each app creates **its own store** (`makeCustomerStore`, `makeAdminStore`) and mounts it with `<Provider>`, so the two apps stay independent. Both stores include the shared `catalog` and `orders` slices; everything else belongs to one app:

| Store    | Slices                                              |
| -------- | --------------------------------------------------- |
| Customer | `catalog`, `orders`, `meta`, `auth`, `cart`, `toast`, `authDialog`, `checkout` |
| Admin    | `catalog`, `orders`, `meta`, `auth`                 |

- Components read state through selectors (`createSelector` for derived data such as the cart total) and change it by dispatching actions, through small hooks such as `useCatalog()`, `useOrders()`, `useCart()` and `useCustomer()`.
- Anything that talks to the data layer is a thunk. Loads (`loadCatalog`, `loadOrders`) and sign in / sign up are `createAsyncThunk`s that track `idle` / `loading` / `ready` / `failed`; changes (`saveProduct`, `removeProduct`, `placeOrders`, `setOrderStep`, `importSkus`, `payAndCheckout`...) call the API first and update the store only once it agrees, and throw the API's message for the screen to show. Every thunk reaches the API through RTK's `extraArgument`, never by importing it, so tests can hand them a different one.
- State stays serializable. The login popup keeps *what to do after logging in* as data (`{ kind: "checkout" }` or `{ kind: "navigate", to }`), not a callback, and passwords never enter the store.
- Each login (user and token) is kept in its own `sessionStorage` key for the tab. The catalog and orders are no longer saved by the store: where they live is the data layer's business (below).
- The slices have no React in them, so they are tested with `node --test` against the mock API (`src/shared/store/store.test.ts`, `src/customer/store/store.test.ts`); `src/shared/api/api.test.ts` tests the HTTP side with a fake `fetch`.

Each app's stylesheet is scoped to its own root (`.cx` for the customer app, `.ax` for admin), so styles cannot leak between them. The only data the apps share is the product catalog: SKUs imported by admins show up in the storefront.

## Connecting a real API

All data goes through one layer, `src/shared/api/`, so swapping the sample data for your server is configuration, not a rewrite. Screens and slices only know the interfaces in `types.ts` (`ProductsApi`, `OrdersApi`, `CustomerAuthApi`, `AdminAuthApi`, `PaymentsApi`, `ImportApi`). Each has two implementations: `mock.ts` (the sample data, kept in this browser) and `httpApi.ts` (your server). `createApi` in `index.ts` picks one **per resource**, so you can connect them one at a time.

1. Copy `.env.example` to `.env.local` and set `VITE_API_URL` (every resource then defaults to a path under it), or set a resource's own URL, which wins. Restart `npm run dev`.
2. A resource with no URL keeps using the sample data. When any resource is still on samples, the storefront footer and the admin sidebar say so; the sign-in hints, the dummy card hint and **Reset catalog** only appear for the resource that is on the mock.
3. Everything the server sends back is checked (`isProduct`, `isOrder`, ...) before the app uses it; anything unexpected shows as "the server sent ... in a format this app does not understand".

| Resource | Variable (default path)          | Requests                                                                                                  |
| -------- | -------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Products | `VITE_PRODUCTS_URL` (`/products`) | `GET` the list (array of products) · `PATCH /:id` with the edited fields → the product · `DELETE /:id` · `POST /:id/restore` → the product (the Undo after a delete, so delete should be a soft delete) · `POST /import` with `{ rows }` → `{ added, updated }` |
| Orders   | `VITE_ORDERS_URL` (`/orders`)     | `GET` the list (a customer's token returns their own, an admin's returns everyone's) · `POST` with `{ customer, shipping, paymentRef, groups }` → the created orders, one per group, ids assigned by the server · `PATCH /:id` with `{ step }` (0 to 3) → the order · `DELETE /:id` · `POST /:id/restore` → the order |
| Customer sign-in | `VITE_CUSTOMER_AUTH_URL` (`/auth`) | `POST /login` with `{ email, password }` and `POST /register` with `{ name, email, password }`, both → `{ user: { name, email }, token }` |
| Admin sign-in | `VITE_ADMIN_AUTH_URL` (`/admin/auth`) | `POST /login` with `{ identity, password }` (work email or employee ID) → `{ user: { name, email }, token }` |
| Payments | `VITE_PAYMENTS_URL` (`/payments`) | `POST` with `{ amount, currency, card }` → `{ ref }`. Answer `402` (or `422`) with `{ message }` for a declined card |
| Import   | `VITE_IMPORT_URL` (`/import`)     | `POST /connect` with `{ connector, service, settings }` (the Import page's connection form) → `{ rows }` of SKU rows |

The product, order and row shapes are the `Product`, `Order` and `SkuRow` types in `src/shared/lib/` (`data.ts`, `orderlogic.ts`, `csv.ts`); an order's optional `shipping` is the delivery address. Errors are plain HTTP errors: the body's `message` (or `error`) is shown to the person, and a `401` signs them out. After sign-in the token is sent as `Authorization: Bearer <token>`.

Things a real server must do that this front end cannot:

- **Own the money and the stock.** The amount the browser sends and the prices in `groups` are what the customer saw; recompute them from your own catalog, check stock, and check `paymentRef` belongs to a successful payment for that amount.
- **Scope orders by token** (customers see only theirs) and enforce admin-only routes. The front end hides admin screens, it does not secure them.
- **Cards:** the dummy `PaymentsApi` sends card details to your endpoint. Before taking real payments, tokenize the card in the browser with your gateway's hosted fields and send the token instead (`httpPayments`, marked `shortcut:`).
- **Tokens** live in `sessionStorage` for the tab. If you prefer an httpOnly cookie, have the server set it and change `createHttp` to send `credentials: "include"`.
- If the card is charged and then the order call fails, the customer is told the payment reference and not to pay again; a server that makes the charge and the order one call avoids that.

Screens show "Loading...", then the data, or the API's error with a **Try again** button (`LoadGate`). Orders reload when the tab regains focus, so a status change made elsewhere appears without a reload. Revenue, the status counts and the dashboard chart are worked out in the browser from the orders list; with a large order history, serve them from an endpoint instead.

## Status: sample data by default

With no URLs set this is a working prototype:

- **Accounts are mocked in the browser** (`src/shared/api/mockAccounts.ts`: plaintext passwords in `localStorage`, one hard-coded admin). Do not deploy that: set the auth URLs.
- **Products and orders are sample data** in `src/shared/lib/data.ts` and `orderlogic.ts`, kept in `localStorage` by `mock.ts`. The customer and admin apps read and write the same storage, so an order placed in the storefront shows up in the admin portal.
- **Checkout payments are a dummy**: no money moves (see the test cards above).
- The cart lives in the customer store's memory and resets on reload.
- "Forgot password" and company SSO are placeholders.
