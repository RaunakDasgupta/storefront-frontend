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
| `/login`                           | Everyone        | Customer / Employee sign-in                       |
| `/account`                         | Customers       | Account page with recent orders                   |
| `/staff`, `/staff/orders`, `/staff/products` | Employees | Overview stats, orders table, product inventory   |

Signed-out visitors who open a protected route are sent to `/login` and returned afterwards. Signing in with the wrong role sends you to your own home (`/` for customers, `/staff` for employees).

## Project layout

```
src/main.tsx         React root, router and providers
src/App.tsx          Route table
src/auth.tsx         Auth context, role route guard
src/cart.tsx         Cart context
src/data.ts          Mock products and orders
src/components.tsx   Store/staff layouts, product card
src/LoginPage.tsx    Sign-in page
src/pages/           Home, Product, Cart, Account, Staff, NotFound
src/styles.css       Shared tokens and sign-in styles
src/store.css        Storefront and staff portal styles
```

## Status: mock backend

There is no backend yet, so this is a working prototype:

- **Sign-in accepts any non-empty email and password** and keeps the user in `sessionStorage`. Do not deploy it as is. Replace `signIn()` in `src/auth.tsx` with a call to your auth API.
- **Products and orders are hard-coded** in `src/data.ts`.
- **Checkout is disabled**; there is no payment provider. The cart lives in memory and resets on reload.
- "Forgot password", "Create an account" and company SSO are placeholders.
