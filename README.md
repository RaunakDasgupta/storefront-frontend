# storefront-frontend

Storefront UI built with **React 19**, **TypeScript**, **Vite** and **React Router**. It has a Shopify-inspired customer storefront and a staff portal, behind one sign-in page with a Customer / Employee toggle.

## Getting started

Requires Node.js 20+.

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

| Script              | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the Vite dev server             |
| `npm run build`     | Typecheck, then build into `dist/`    |
| `npm run preview`   | Serve the production build locally    |
| `npm run typecheck` | Run `tsc` without emitting files      |
| `npm test`          | Run the CSV parser and data tests     |

## Pages

| Route                              | Who             | What                                              |
| ---------------------------------- | --------------- | ------------------------------------------------- |
| `/`                                | Everyone        | Landing page: hero, filterable product grid, perks |
| `/products/:id`                    | Everyone        | Product detail with add to cart                   |
| `/cart`                            | Everyone        | Cart with quantity controls and subtotal          |
| `/login`                           | Everyone        | Customer / Employee log in                        |
| `/signup`                          | Everyone        | Create a customer account (staff are provisioned) |
| `/account`                         | Customers       | Account page with recent orders                   |
| `/staff`, `/staff/orders`, `/staff/products` | Employees | Overview stats, orders table, product inventory   |

Layouts are responsive from small phones (about 360px) up to wide desktops: the storefront switches to two-column grids and a static header on phones, and the staff portal's sidebar becomes a horizontal tab strip below 900px.

The storefront follows Shopify's Dawn theme (announcement bar, hero with floating badges, scrolling ticker, category tiles, best-seller carousel, sale banner, reviews, newsletter) and the staff portal follows the Polaris admin look (dark top bar, light navigation, a dashboard with revenue cards, a 7-day sales chart, order status, top products, low stock and the CSV import).

Signed-out visitors who open a protected route are sent to `/login` and returned afterwards. Signing in with the wrong role sends you to your own home (`/` for customers, `/staff` for employees).

## Importing SKUs from CSV

On the staff dashboard (`/staff`, section "Import SKUs from CSV"), drop in a `.csv` file with one SKU per row. You see a preview (with the logos, and whether each row is new or an update) and a list of problem rows before anything changes. Use **Download template** for a working example.

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

Header names are case-insensitive, and `logo`, `image` and `image_url` also work for `logo_url`. Files are limited to 1 MB and 1,000 rows. Rows with problems are skipped and nothing is ever deleted. Imported SKUs appear in the storefront and the Products table straight away. They are stored in this browser's `localStorage`, and **Reset catalog** on the Products page restores the 8 sample products.

Logo links are loaded straight from the URL you give, so the image host must allow hotlinking. If a link is broken, a placeholder icon is shown.

## Prices and photos

Prices are in Indian rupees (₹), formatted with the `en-IN` locale (for example ₹1,23,456), and free shipping starts at ₹999. Product photos are in `public/products/<product-id>.jpg` (900x900) with 200px versions in `public/products/thumbs/` for tables and the cart. To change a photo, replace the file with the same name.

The photos are free stock images from [Unsplash](https://unsplash.com), used under the [Unsplash License](https://unsplash.com/license). They are placeholders: swap in your own product photography before launch.

## Demo logins

Pick the matching tab on `/login`. The page also shows these (with a "Fill in these details" button) in `npm run dev`; production builds hide them.

| Account  | Email / ID                                         | Password      |
| -------- | -------------------------------------------------- | ------------- |
| Customer | `customer@storefront.test`                         | `customer123` |
| Employee | `staff@storefront.test` or employee ID `EMP-1001`  | `staff1234`   |

Accounts are role-specific: the customer login does not work on the Employee tab. New accounts from `/signup` are kept in the browser's `localStorage` and can log in on the Customer tab.

The profile avatar in the storefront header is blank when logged out and opens a menu with Log in and Create account. When logged in it shows your initial with My account (or Staff portal) and Log out.

## Project layout

```
src/main.tsx         React root, router and providers
src/App.tsx          Route table
src/auth.tsx         Auth context, role route guard
src/cart.tsx         Cart context
src/data.ts          Mock products and orders
src/components.tsx   Store/staff layouts, product card
src/AuthShell.tsx    Shared log in / create account layout and form field
src/LoginPage.tsx    Log in page (Customer / Employee)
src/SignupPage.tsx   Create account page
src/pages/           Home, Product, Cart, Account, Staff, NotFound
src/styles.css       Shared tokens, buttons and auth page styles
src/store.css        Storefront and staff portal styles
```

## Status: mock backend

There is no backend yet, so this is a working prototype:

- **Accounts are mocked in the browser.** The demo accounts and any sign-ups (plaintext passwords in `localStorage`) are checked in `src/auth.tsx`, and the signed-in user lives in `sessionStorage`. Do not deploy as is: replace `signIn()` and `signUp()` with calls to your auth API.
- **Dashboard figures come from the sample orders in `src/data.ts`: the sales chart is built from them, so its total always matches the Revenue card. Units sold, reviews and the "4.9 from 2,300 reviews" badge are sample data.**
- **Products and orders are hard-coded** in `src/data.ts`.
- **Checkout is disabled**; there is no payment provider. The cart lives in memory and resets on reload.
- "Forgot password", company SSO and the newsletter form are placeholders.
