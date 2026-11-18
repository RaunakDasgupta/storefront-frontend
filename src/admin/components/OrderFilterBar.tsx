import { useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { STEPS } from "../../shared/lib/orderlogic";
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

  const statusParam = params.get("status") ?? "";
  /** The fulfilment status to show (a name from STEPS), or "" for all. Only the Overview uses this; the Orders page has status tabs. */
  const status = (STEPS as readonly string[]).includes(statusParam) ? statusParam : "";

  return { filters, status, filtering: isFiltering(filters), today: new Date().toISOString().slice(0, 10), set, clear };
}

type Props = {
  filters: OrderFilters;
  /** The delivery states and cities to offer. The cities are already narrowed to the chosen state. */
  states: string[];
  cities: string[];
  /** How many orders match, shown at the end of the row. */
  count: number;
  /** With these, a Status filter is shown too (the Overview). `status` is "" for all. */
  statuses?: readonly string[];
  status?: string;
  /** Show "Clear filters" even when only something outside this bar is active (a search, for example). */
  showClear: boolean;
  set: (patch: Record<string, string | null>) => void;
  onClear: () => void;
};

/** One labelled filter. Two to a row on a phone. */
function Filter({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div className="mb-2 min-w-[150px] max-sm:min-w-0 max-sm:flex-[1_1_calc(50%-7px)]">
      <label htmlFor={id} className="mb-1 text-[12.5px] font-[550] text-muted">{label}</label>
      {children}
    </div>
  );
}
const CONTROL = "h-9 border-[#cfcfcf]";

export function OrderFilterBar({ filters, states, cities, statuses, status = "", count, showClear, set, onClear }: Props) {
  return (
    <div className="mb-[18px] flex flex-wrap items-end gap-x-3.5" role="group" aria-label="Filter orders">
      <Filter id="of-date" label="Placed">
        <select id="of-date" className={CONTROL} value={filters.date} onChange={(e) => set({ date: e.target.value === "all" ? null : e.target.value, ...(e.target.value === "custom" ? {} : { from: null, to: null }) })}>
          {DATE_PRESETS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
        </select>
      </Filter>
      {filters.date === "custom" && (
        <>
          <Filter id="of-from" label="From">
            <input id="of-from" type="date" className={CONTROL} value={filters.from} max={filters.to || undefined} onChange={(e) => set({ from: e.target.value || null })} />
          </Filter>
          <Filter id="of-to" label="To">
            <input id="of-to" type="date" className={CONTROL} value={filters.to} min={filters.from || undefined} onChange={(e) => set({ to: e.target.value || null })} />
          </Filter>
        </>
      )}
      {statuses && (
        <Filter id="of-status" label="Status">
          <select id="of-status" className={CONTROL} value={status} onChange={(e) => set({ status: e.target.value || null })}>
            <option value="">All statuses</option>
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Filter>
      )}
      <Filter id="of-value" label="Order value">
        <select id="of-value" className={CONTROL} value={filters.value} onChange={(e) => set({ value: e.target.value === "all" ? null : e.target.value })}>
          {VALUE_BANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
      </Filter>
      <Filter id="of-state" label="Delivery state">
        {/* the city list follows the state, so a state change drops a city that is no longer in it */}
        <select id="of-state" className={CONTROL} value={filters.state} onChange={(e) => set({ state: e.target.value || null, city: null })}>
          <option value="">Any state</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
          {filters.state && !states.includes(filters.state) && <option value={filters.state}>{filters.state}</option>}
        </select>
      </Filter>
      <Filter id="of-city" label="Delivery city">
        <select id="of-city" className={CONTROL} value={filters.city} onChange={(e) => set({ city: e.target.value || null })}>
          <option value="">Any city</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          {filters.city && !cities.includes(filters.city) && <option value={filters.city}>{filters.city}</option>}
        </select>
      </Filter>
      {showClear && <button type="button" className="linkbtn mb-4 font-[550]" onClick={onClear}>Clear filters</button>}
      <p className="mr-0 mb-3.5 ml-auto text-muted" aria-live="polite">{count} {count === 1 ? "order" : "orders"}</p>
    </div>
  );
}
