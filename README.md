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

The storefront follows Shopify's Dawn theme (announcement bar, editorial hero, category tiles, quick add, sale badges, newsletter) and the staff portal follows the Polaris admin look (dark top bar, light navigation, card layout). There are no image assets yet, so product photos are emoji on soft backgrounds.

Signed-out visitors who open a protected route are sent to `/login` and returned afterwards. Signing in with the wrong role sends you to your own home (`/` for customers, `/staff` for employees).

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

- **Log in accepts any non-empty email and password** and keeps the user in `sessionStorage`. **Create account** validates the form but creates nothing. Do not deploy as is: replace `signIn()` and `signUp()` in `src/auth.tsx` with calls to your auth API.
- **Products and orders are hard-coded** in `src/data.ts`.
- **Checkout is disabled**; there is no payment provider. The cart lives in memory and resets on reload.
- "Forgot password", company SSO and the newsletter form are placeholders.
