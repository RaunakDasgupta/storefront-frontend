import { useState } from "react";
import { money } from "../../shared/lib/data";
import { STEPS } from "../../shared/lib/orderlogic";

const W = 560, H = 220, LEFT = 44, RIGHT = 8, TOP = 12, BOTTOM = 28;
const compact = (n: number) => (n >= 1000 ? `₹${+(n / 1000).toFixed(1)}k` : `₹${n}`);
const dayLabel = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

/** A bar with only its top corners rounded, sitting on the baseline. */
const barPath = (x: number, y: number, w: number, base: number, r = 4) => {
  const h = base - y, rr = Math.min(r, h, w / 2);
  return h <= 0 ? "" : `M${x},${base}V${y + rr}a${rr},${rr} 0 0 1 ${rr},${-rr}h${w - 2 * rr}a${rr},${rr} 0 0 1 ${rr},${rr}V${base}Z`;
};

/** Revenue per day as thin bars. Hover or focus a day to read its numbers; the same data is in the orders table below. */
export function RevenueChart({ days }: { days: { date: string; revenue: number; orders: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.revenue));
  const top = Math.ceil(max / 4 / 100) * 400 || 4; // a round axis maximum, in four steps
  const plotW = W - LEFT - RIGHT, plotH = H - TOP - BOTTOM, base = TOP + plotH;
  const slot = plotW / Math.max(days.length, 1), bar = Math.min(28, slot * 0.5);
  const y = (v: number) => TOP + plotH - (v / top) * plotH;
  const shown = hover === null ? null : days[hover];

  return (
    <div>
      <p className="mb-1 min-h-[22px] text-[13.5px]" aria-live="polite">
        {shown ? <><strong>{dayLabel(shown.date)}</strong> · {money(shown.revenue)} from {shown.orders} {shown.orders === 1 ? "order" : "orders"}</> : <span className="text-muted">Hover a day for details</span>}
      </p>
      <svg className="block h-auto w-full" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Revenue per day, ${days.length} days: ${days.map((d) => `${dayLabel(d.date)} ${money(d.revenue)}`).join(", ")}`}>
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1={LEFT} x2={W - RIGHT} y1={y((top / 4) * i)} y2={y((top / 4) * i)} className="stroke-line" strokeWidth={1} />
            <text x={LEFT - 8} y={y((top / 4) * i) + 4} textAnchor="end" className="fill-muted text-[11px]">{compact((top / 4) * i)}</text>
          </g>
        ))}
        {days.map((d, i) => {
          const x = LEFT + slot * i + (slot - bar) / 2;
          return (
            <g key={d.date}>
              <path d={barPath(x, y(d.revenue), bar, base)} className={`fill-brand transition-opacity duration-150 ${hover === i ? "opacity-100" : "opacity-85"}`} />
              <text x={x + bar / 2} y={H - 8} textAnchor="middle" className="fill-muted text-[11px]">{dayLabel(d.date)}</text>
              {/* a wider invisible target than the bar, so it is easy to hit */}
              <rect x={LEFT + slot * i} y={TOP} width={slot} height={plotH + BOTTOM} className="fill-transparent focus-visible:outline-2 focus-visible:outline-focus" tabIndex={0} aria-label={`${dayLabel(d.date)}: ${money(d.revenue)}, ${d.orders} orders`}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)} onBlur={() => setHover(null)} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/** How many orders sit at each fulfilment step, one hue from light to dark as the order moves along. */
export function StatusBars({ counts, selected, onSelect }: { counts: number[]; /** The status being filtered on, if any. */ selected?: string; onSelect: (status: string | null) => void }) {
  const max = Math.max(1, ...counts);
  return (
    <ul className="mt-2 flex flex-col gap-3.5">
      {STEPS.map((label, i) => (
        <li key={label} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1">
          <button type="button" className="justify-self-start border-0 bg-transparent p-0 text-left hover:underline aria-pressed:font-bold aria-pressed:text-forest" aria-pressed={selected === label} title={selected === label ? "Show all statuses" : `Show only ${label}`} onClick={() => onSelect(selected === label ? null : label)}>{label}</button>
          <span className="col-span-full row-start-2 h-2 overflow-hidden rounded bg-soft" aria-hidden="true"><span className="block h-full rounded bg-brand" style={{ width: `${(counts[i] / max) * 100}%`, opacity: 0.4 + i * 0.2 }} /></span>
          <strong className="text-[15px]">{counts[i]}</strong>
        </li>
      ))}
    </ul>
  );
}
