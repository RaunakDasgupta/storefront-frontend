# storefront-frontend

Two independent apps in one **React 19 + TypeScript + Vite** project, built around keeping each flow short and easy to navigate:

- **Customer storefront** at `/`: browse, search, add to cart, and manage an account.
- **Staff portal** at `/staff`: dashboard, orders, products and CSV SKU import.

The two apps have their own log in pages, sessions, route guards, layouts and stylesheets. Neither links to the other, being signed in to one never signs you in to the other, and each is built and loaded as a separate bundle.

## Getting started

Requires Node.js 20+.

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
| `npm test`          | Run the CSV parser and data tests     |

## Demo logins

Each app has its own login page. The page shows these (with a "Fill in these details" button) in `npm run dev`; production builds hide them.

| App      | Log in at      | Email / ID                                         | Password      |
| -------- | -------------- | -------------------------------------------------- | ------------- |
| Customer | `/login`       | `customer@storefront.test`                         | `customer123` |
| Staff    | `/staff/login` | `staff@storefront.test` or employee ID `EMP-1001`  | `staff1234`   |

Customer credentials do not work on the staff login, and the other way round. New customer accounts from `/signup` are kept in the browser's `localStorage`. Staff accounts are provisioned, so there is no staff sign-up.

## Customer storefront

| Route                | What it does                                                           |
| -------------------- | ---------------------------------------------------------------------- |
| `/`                  | Hero, category tiles, four featured products, delivery perks           |
| `/shop`              | All products with search, category chips, an "On sale" filter and sort |
| `/products/:id`      | Product page with add to cart                                          |
| `/cart`              | Quantities, total and a free-shipping hint                             |
| `/login`, `/signup`  | Customer log in and create account                                     |
| `/account`           | Profile and recent orders (log in required)                            |

The header has two links (Shop, Sale), the cart and a profile avatar. The avatar is blank when logged out and opens a menu with Log in and Create account. Shop filters live in the URL (`/shop?category=Bags&sale=1&q=tote`), so any filtered view can be linked to.

## Staff portal

| Route             | What it does                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------ |
| `/staff`          | Overview: revenue, orders, average order, SKUs, a 7-day sales chart, what needs attention, recent orders |
| `/staff/orders`   | Orders with status tabs (All, Pending, Paid, Fulfilled) and search                         |
| `/staff/products` | Products with SKU, logo, price and inventory, a low-stock filter and search               |
| `/staff/import`   | Import SKUs from CSV                                                                       |
| `/staff/login`    | Staff log in                                                                               |

Navigation is a left sidebar on desktop and a bottom tab bar on phones, so the four sections are always one tap away. "Needs attention" on the overview links straight to the pending orders and the low-stock products. The sales chart is built from the same sample orders as the Revenue card, so the two always agree.

### Importing SKUs from CSV

On `/staff/import`, drop in a `.csv` file with one SKU per row. You see a preview (with the logos, and whether each row is new or an update) and a list of problem rows before anything changes. **Download template** gives a working example.

| Column             | Required | Notes                                                         |
| ------------------ | -------- | ------------------------------------------------------------- |
| `sku`              | yes      | Unique key. An existing SKU is updated, a new one is added.   |
| `name`             | yes      | Up to 120 characters.                                         |
| `price`            | yes      | Rupees, for example `1499` or `₹1,499`.                       |
| `category`         | no       | Defaults to `General`.                                        |
| `compare_at_price` | no       | Shown as the crossed-out price when higher than `price`.      |
| `stock`            | no       | Whole number, defaults to `0`.                                |
| `description`      | no       | Up to 500 characters. Blank keeps the current description.    |
| `logo_url`         | no       | Full `http(s)` link to the product logo or photo. Blank keeps the current image. |

Header names are case-insensitive, and `logo`, `image` and `image_url` also work for `logo_url`. Files are limited to 1 MB and 1,000 rows. Rows with problems are skipped and nothing is ever deleted. Imported SKUs appear in the storefront and the Products table straight away. They are stored in this browser's `localStorage`, and **Reset catalog** on the Products page restores the 8 sample products. Logo links load straight from the URL you give, so the image host must allow hotlinking; a broken link shows a placeholder icon.

## Prices and photos

Prices are in Indian rupees (₹), formatted with the `en-IN` locale (for example ₹1,23,456), and free shipping starts at ₹999. Product photos are in `public/products/<product-id>.jpg` (900x900) with 200px versions in `public/products/thumbs/` for tables and the cart. To change a photo, replace the file with the same name.

The photos are free stock images from [Unsplash](https://unsplash.com), used under the [Unsplash License](https://unsplash.com/license). They are placeholders: swap in your own product photography before launch.

## Project layout

```
src/main.tsx            Router entry
src/App.tsx             Loads the customer or staff app by URL (/staff/* is staff)
src/shared/             Only what both apps genuinely share
  data.ts               Sample products and orders, money formatting
  catalog.tsx           Catalog state (sample products plus CSV imports)
  csv.ts, csv.test.ts   CSV parser and validation, with tests
  ui.tsx                Icon, Logo, ProductImage, Field, Menu, OrdersTable
  base.css              Colour tokens and primitives (buttons, forms, tables)
src/customer/           The storefront: auth, cart, layout, pages, customer.css
src/staff/              The staff portal: auth, layout, pages, staff.css
```

Each app's stylesheet is scoped to its own root (`.cx` for the customer app, `.sx` for staff), so styles cannot leak between them. The only data the apps share is the product catalog: SKUs imported by staff show up in the storefront.

## Status: mock backend

There is no backend yet, so this is a working prototype:

- **Accounts are mocked in the browser.** The demo accounts and any customer sign-ups (plaintext passwords in `localStorage`) are checked in `src/customer/auth.tsx` and `src/staff/auth.tsx`, and each session lives in its own `sessionStorage` key. Do not deploy as is: replace `signIn()` and `signUp()` with calls to your auth API.
- **Products and orders are sample data** in `src/shared/data.ts`. Imported SKUs persist in `localStorage` only.
- **Checkout is disabled**; there is no payment provider. The cart lives in memory and resets on reload.
- "Forgot password" and company SSO are placeholders. The 14 orders shown to staff and the customer's recent orders are the same sample data.
