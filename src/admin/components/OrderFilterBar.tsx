import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { DATE_PRESETS, VALUE_BANDS, isFiltering, type DatePreset, type OrderFilters, type ValueBand } from "../lib/orderfilters";

const KEYS = ["date", "from", "to", "value", "state", "city"] as const;

/** The date, order value and delivery city filters, kept in the page's URL (`?date=7d&value=high&state=Maharashtra&city=Pune`). Used by Overview and Orders. */
export function useOrderFilters() {
  const [params, setParams] = useSearchParams();
  const dateParam = params.get("date");
  const valueParam = params.get("value");
  const filters: OrderFilters = useMemo(() => ({
    date: DATE_PRESETS.some((d) => d.id === dateParam) ? (dateParam as DatePreset) : "all",
    from: params.get("from") ?? "",
    to: params.get("to") ?? "",
    value: VALUE_BANDS.some((b) => b.id === valueParam) ? (valueParam as ValueBand) : "all",
    state: params.get("state") ?? "",
    city: params.get("city") ?? "",
  }), [params, dateParam, valueParam]);

  /** Sets or (with null) removes URL parameters. Takes the latest URL each time, so quick edits never overwrite each other. */
  const set = (patch: Record<string, string | null>) =>
    setParams((prev) => { const next = new URLSearchParams(prev); for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k); return next; }, { replace: true });
  /** Removes the filters, and any other parameters named in `also` (the Orders page's search, for example). */
  const clear = (...also: string[]) => set(Object.fromEntries([...KEYS, ...also].map((k) => [k, null])));

  return { filters, filtering: isFiltering(filters), today: new Date().toISOString().slice(0, 10), set, clear };
}

type Props = {
  filters: OrderFilters;
  /** The delivery states and cities to offer. The cities are already narrowed to the chosen state. */
  states: string[];
  cities: string[];
  /** How many orders match, shown at the end of the row. */
  count: number;
  /** Show "Clear filters" even when only something outside this bar is active (a search, for example). */
  showClear: boolean;
  set: (patch: Record<string, string | null>) => void;
  onClear: () => void;
};

export function OrderFilterBar({ filters, states, cities, count, showClear, set, onClear }: Props) {
  return (
    <div className="filterbar" role="group" aria-label="Filter orders">
      <div className="field">
        <label htmlFor="of-date">Placed</label>
        <select id="of-date" value={filters.date} onChange={(e) => set({ date: e.target.value === "all" ? null : e.target.value, ...(e.target.value === "custom" ? {} : { from: null, to: null }) })}>
          {DATE_PRESETS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
      </div>
      {filters.date === "custom" && (
        <>
          <div className="field">
            <label htmlFor="of-from">From</label>
            <input id="of-from" type="date" value={filters.from} max={filters.to || undefined} onChange={(e) => set({ from: e.target.value || null })} />
          </div>
          <div className="field">
            <label htmlFor="of-to">To</label>
            <input id="of-to" type="date" value={filters.to} min={filters.from || undefined} onChange={(e) => set({ to: e.target.value || null })} />
          </div>
        </>
      )}
      <div className="field">
        <label htmlFor="of-value">Order value</label>
        <select id="of-value" value={filters.value} onChange={(e) => set({ value: e.target.value === "all" ? null : e.target.value })}>
          {VALUE_BANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="of-state">Delivery state</label>
        {/* the city list follows the state, so a state change drops a city that is no longer in it */}
        <select id="of-state" value={filters.state} onChange={(e) => set({ state: e.target.value || null, city: null })}>
          <option value="">Any state</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
          {filters.state && !states.includes(filters.state) && <option value={filters.state}>{filters.state}</option>}
        </select>
      </div>
      <div className="field">
        <label htmlFor="of-city">Delivery city</label>
        <select id="of-city" value={filters.city} onChange={(e) => set({ city: e.target.value || null })}>
          <option value="">Any city</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          {filters.city && !cities.includes(filters.city) && <option value={filters.city}>{filters.city}</option>}
        </select>
      </div>
      {showClear && <button type="button" className="linkbtn filter-clear" onClick={onClear}>Clear filters</button>}
      <p className="muted filter-count" aria-live="polite">{count} {count === 1 ? "order" : "orders"}</p>
    </div>
  );
}
