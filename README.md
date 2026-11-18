# storefront-frontend

Two independent apps in one **React 19 + TypeScript + Vite + Redux Toolkit** project, built around keeping each flow short and easy to navigate:

- **Customer storefront ("Everyday Market")** at `/`: retail and bulk shopping, a cart with a simulated checkout, and order-progress tracking.
- **Staff portal ("Everyday Market Staff")** at `/staff`: dashboard, orders, products and CSV SKU import.

The two apps have their own logins, sessions, route guards, layouts and stylesheets. Neither links to the other, being signed in to one never signs you in to the other, and each is built and loaded as a separate bundle.

## Getting started

Requires Node.js 22.18+ (the tests run TypeScript directly).

```bash
npm install
npm run dev
```

Then open http://localhost:5173 (customer) or http://localhost:5173/staff (staff).

| Script              | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the Vite dev server             |
| `npm run build`     | Typecheck, then build into `dist/`    |
| `npm run preview`   | Serve the production build locally    |
| `npm run typecheck` | Run `tsc` without emitting files      |
| `npm test`          | Run the unit tests (`src/**/*.test.ts`) |
| `npm run check`     | Typecheck, run the tests and build. Run it after every change |

## Demo logins

Each app has its own login. The customer login is a popup and the staff login is a page. Both show these (with a Fill in button) in `npm run dev`; production builds hide them.

| App      | Log in at      | Email / ID                                         | Password      |
| -------- | -------------- | -------------------------------------------------- | ------------- |
| Customer | popup (or `/login`) | `customer@storefront.test`                         | `customer123` |
| Staff    | `/staff/login` | `staff@storefront.test` or employee ID `EMP-1001`  | `staff1234`   |

Customer credentials do not work on the staff login, and the other way round. New customer accounts from `/signup` are kept in the browser's `localStorage`. Staff accounts are provisioned, so there is no staff sign-up.

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
- **Demo checkout:** the cart's **Checkout** button needs a log in. If you are logged out, a **login popup** opens right over the cart (no page change): log in, or switch to **Create an account** in the same popup, and the checkout popup opens next. Checkout is a short popup flow: **1. Delivery address** (name, mobile number, address, city, state, 6-digit PIN code), **2. Payment** with a **dummy payment gateway**, then an **Order placed** popup showing the order number(s), the amount paid, a payment reference and where it is going, with **View order** and **Continue shopping** buttons. No real payment is taken and no network call is made: use the test card `4242 4242 4242 4242` with any future expiry and any security code (the **Fill in test card** button does this), or `4000 0000 0000 0002` to see a declined payment. Card numbers are checked (Luhn), and card details are never stored: they stay in the payment form. The delivery address is saved on each order. Paying creates an order (`ORD_1002`, ...) at **Confirmed** and clears the cart. A cart with both retail and bulk items becomes **two orders** (one per channel), because they are fulfilled separately, paid in one payment. The demo customer's sample order, `ORD_1001`, is at **Preparing**. Customers only see their own orders. The same orders appear in the staff portal. Orders only move forward when staff change their status (see below).
- **Log in and sign up are popups, not pages.** The profile avatar is blank when logged out and its menu opens the same popup in Log in or Create account mode (with a link to switch between them), as do checkout and protected pages such as My orders (a logged-out visitor lands on the landing page with the popup open and returns to the page after logging in). The old `/login` and `/signup` addresses still work: they open the popup over the landing page. Once you are logged in it shows your initial and the menu lists **My orders**, **My account** and **Log out**. There is no My orders tab in the header.

## Staff portal

| Route             | What it does                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `/staff`          | Overview: a Retail and a Bulk summary (revenue and order count each), then recent retail and recent bulk orders as cards in a 3 x 2 grid that scrolls sideways. A card opens that order in the Orders list. |
| `/staff/orders`   | Every order placed in the storefront as cards in a 3 x 2 grid that scrolls sideways, with **Retail orders** and **Bulk orders** on separate tabs (`?type=bulk`), status tabs (All, Confirmed, Preparing, Packed, Ready for dispatch) and search. **Staff change an order's status from the dropdown on its card**, and the customer's tracker updates (live if the storefront is open in another tab). **Delete** asks first, removes the order from the portal and from the customer's My orders, and a notice offers **Undo** for 10 seconds. |
| `/staff/products` | Products as **editable, deletable cards** in the same 3 x 2 grid that scrolls sideways (photo, name and size, SKU and category, stock, price), with **Retail products** and **Bulk products** on separate tabs (`?type=bulk`), a low-stock filter and search. **Edit** opens a dialog for the name, size, category, type, price, compare-at price, stock, description and photo link (the SKU stays fixed). **Delete** asks first, removes the product from the storefront, and a notice offers **Undo** for 10 seconds. Orders that already include a deleted product keep their items. **Reset catalog** brings back the samples. |
| `/staff/import`   | Import SKUs from CSV                                                                       |
| `/staff/login`    | Staff log in                                                                               |

The staff portal uses the same look as the storefront (white, green, rounded, underline tabs). The navigation is always a row of tabs at the top, on phones too, so the four sections are one tap away.

### Importing SKUs from CSV

On `/staff/import`, drop in a `.csv` file with one SKU per row. You see a preview (with the logos, and whether each row is new or an update) and a list of problem rows before anything changes. **Download template** gives a working example.

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
src/App.tsx              Loads the customer or staff app by URL (/staff/* is staff)
src/shared/              Only what both apps genuinely share
  lib/                   Pure code with no React: data.ts, csv.ts, orderlogic.ts, productform.ts (tests in lib.test.ts)
  store/                 Redux slices for the catalog and orders, persistence.ts (the mock backend), typed hooks, store.test.ts
  hooks/                 useCatalog and useOrders: selectors plus dispatch for the components
  ui/                    Icon, Logo, ProductImage, Field, Menu (index.tsx) and base.css (colour tokens and primitives)
src/customer/            The storefront (its styles are scoped to .cx)
  store/                 Its own store, slices (auth, cart, toast, authDialog, checkout), checkout thunk, dummy payment gateway (gateway.ts), mock accounts, store.test.ts
  hooks/                 useCustomer, useCart, useMyOrders, useCategories
  components/            Layout, AuthDialog, CheckoutDialog (address, dummy payment, order placed), Toast, parts (ProductCard, CartPanel and the other pieces)
  pages/                 Shop, Product, Categories, Cart, Orders, Account, NotFound
src/staff/               The staff portal (its styles are scoped to .sx)
  store/                 Its own store, auth slice and mock account
  hooks/                 useStaff
  components/            Layout, RequireStaff, OrderGrid, ProductGrid, ProductEditor, ConfirmDelete, ScrollGrid
  pages/                 Login, Overview, Orders, Products, Import
```

## State management

State lives in [Redux Toolkit](https://redux-toolkit.js.org). Each app creates **its own store** (`makeCustomerStore`, `makeStaffStore`) and mounts it with `<Provider>`, so the two apps stay independent. Both stores include the shared `catalog` and `orders` slices; everything else belongs to one app:

| Store    | Slices                                              |
| -------- | --------------------------------------------------- |
| Customer | `catalog`, `orders`, `auth`, `cart`, `toast`, `authDialog` |
| Staff    | `catalog`, `orders`, `auth`                         |

- Components read state through selectors (`createSelector` for derived data such as the cart total) and change it by dispatching actions, through small hooks such as `useCatalog()`, `useOrders()`, `useCart()` and `useCustomer()`.
- Actions that need a result or several steps are thunks (`placeOrders`, `removeProduct`, `importSkus`, `checkout`). Sign in and sign up are `createAsyncThunk`s.
- State stays serializable. The login popup keeps *what to do after logging in* as data (`{ kind: "checkout" }` or `{ kind: "navigate", to }`), not a callback, and passwords never enter the store.
- `persistence.ts` saves the catalog and orders to `localStorage` and each login to its own `sessionStorage` key whenever they change, and picks up orders changed in another tab.
- The slices have no React in them, so they are tested with `node --test` (`src/shared/store/store.test.ts`, `src/customer/store/store.test.ts`).

Each app's stylesheet is scoped to its own root (`.cx` for the customer app, `.sx` for staff), so styles cannot leak between them. The only data the apps share is the product catalog: SKUs imported by staff show up in the storefront.

## Status: mock backend

There is no backend yet, so this is a working prototype:

- **Accounts are mocked in the browser.** The demo accounts and any customer sign-ups (plaintext passwords in `localStorage`) are checked in `src/customer/store/accounts.ts` and `src/staff/store/accounts.ts`, and each session lives in its own `sessionStorage` key. Do not deploy as is: replace the `signIn` and `signUp` thunks with calls to your auth API.
- **Products and the staff orders are sample data** in `src/shared/lib/data.ts`. Imported SKUs and all orders persist in `localStorage` only. The customer and staff apps read and write the same orders store, so an order placed in the storefront shows up in the staff portal (even in another open tab).
- **Checkout is a demo**: no payment is collected. The cart lives in the customer store's memory and resets on reload.
- "Forgot password" and company SSO are placeholders.
