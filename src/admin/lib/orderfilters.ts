// The extra order filters (Overview and Orders): when the order was placed, how much it was worth, and where it is going.
// Plain functions with no React, so the tests can run under `node --test`.
import type { Order } from "../../shared/lib/orderlogic.ts";

export const DATE_PRESETS = [
  { id: "all", label: "All time" },
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "custom", label: "Custom range" },
] as const;
export type DatePreset = (typeof DATE_PRESETS)[number]["id"];

export const VALUE_BANDS = [
  { id: "all", label: "Any value" },
  { id: "low", label: "Under ₹500", min: 0, max: 499.99 },
  { id: "mid", label: "₹500 to ₹2,000", min: 500, max: 2000 },
  { id: "high", label: "Over ₹2,000", min: 2000.01, max: Infinity },
] as const;
export type ValueBand = (typeof VALUE_BANDS)[number]["id"];

export type OrderFilters = {
  date: DatePreset;
  /** Used with the "custom" date preset: ISO dates (YYYY-MM-DD), either may be empty. */
  from: string;
  to: string;
  value: ValueBand;
  /** A delivery state, or "" for any. */
  state: string;
  /** A delivery city, or "" for any. */
  city: string;
};
export const NO_FILTERS: OrderFilters = { date: "all", from: "", to: "", value: "all", state: "", city: "" };

const DAY = 86_400_000;
const shift = (iso: string, days: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * DAY).toISOString().slice(0, 10);

/** The first and last day (inclusive, ISO dates) the date filter allows; a missing end is open. `today` is an ISO date. */
export function dateBounds(f: Pick<OrderFilters, "date" | "from" | "to">, today: string): { from?: string; to?: string } {
  switch (f.date) {
    case "today": return { from: today, to: today };
    case "7d": return { from: shift(today, -6), to: today };
    case "30d": return { from: shift(today, -29), to: today };
    case "custom": return { from: f.from || undefined, to: f.to || undefined };
    default: return {};
  }
}

export function matchesFilters(o: Order, f: OrderFilters, today: string): boolean {
  const { from, to } = dateBounds(f, today);
  if (from && o.date < from) return false;
  if (to && o.date > to) return false;
  const band = VALUE_BANDS.find((b) => b.id === f.value);
  if (band && "min" in band && (o.total < band.min || o.total > band.max)) return false;
  if (f.state && o.shipping?.state.trim().toLowerCase() !== f.state.toLowerCase()) return false;
  if (f.city && o.shipping?.city.trim().toLowerCase() !== f.city.toLowerCase()) return false;
  return true;
}

/** Whether any of the extra filters is set. */
export const isFiltering = (f: OrderFilters) => f.date !== "all" || f.value !== "all" || f.state !== "" || f.city !== "";

const distinct = (values: string[]) => [...new Set(values.map((v) => v.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));

/** The delivery states in the orders, each once, A to Z. */
export const statesOf = (list: Order[]) => distinct(list.flatMap((o) => (o.shipping ? [o.shipping.state] : [])));

/** The delivery cities in the orders, each once, A to Z. With a state, only the cities in that state. */
export const citiesOf = (list: Order[], state = "") =>
  distinct(list.flatMap((o) => (o.shipping && (!state || o.shipping.state.trim().toLowerCase() === state.toLowerCase()) ? [o.shipping.city] : [])));
