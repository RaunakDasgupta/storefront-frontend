# storefront-frontend

Sign-in UI for the storefront, built with **React 19**, **TypeScript** and **Vite**. One login page serves both account types: a Customer / Employee toggle switches the form between a Shopify-style customer sign-in and a staff sign-in (work email or employee ID, plus an SSO button).

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

## Project layout

```
index.html           Vite entry
src/main.tsx         React root
src/LoginPage.tsx    Customer / Employee sign-in page
src/styles.css       Styles (Shopify-inspired, no UI library)
```

## Status

The UI is complete but **not connected to a backend**: submitting the form shows an error. Wire up `signIn()` in `src/LoginPage.tsx` to your auth API (for example `POST /api/auth/<role>/login`) and redirect on success. "Forgot password", "Create an account" and company SSO are placeholders.
