import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

// Small hand-rolled SVG charts for the admin dashboard, in the shop's own
// palette: one accent hue (cola red) for data, espresso inks for text, and
// recessive hairline grids.
const ACCENT = "#d51f1f";
const INK_MUTED = "rgba(60,38,32,0.45)";
const GRID = "rgba(60,38,32,0.08)";

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const num = (n: number) => Math.round(n).toLocaleString("en-IN");

export function duration(seconds: number | null) {
  if (seconds == null) return ",";
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  return `${m}m ${Math.round(seconds % 60)}s`;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export function Card({
  title,
  subtitle,
  children,
  className = "",
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <section className={`border border-espresso/10 rounded-3xl p-5 sm:p-6 bg-cream min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="font-display text-lg text-espresso">{title}</h2>
          {subtitle && <p className="text-xs text-espresso/50 mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Empty({ children = "No data yet for this period." }: { children?: ReactNode }) {
  return <p className="text-sm text-espresso/45 py-6 text-center">{children}</p>;
}

// --- Stat tile -------------------------------------------------------------

export function StatTile({
  label,
  value,
  current,
  previous,
  lowerIsBetter = false,
  isRate = false,
}: {
  label: string;
  value: string;
  current: number | null;
  previous: number | null;
  lowerIsBetter?: boolean;
  // Rates compare in percentage points, everything else in % change.
  isRate?: boolean;
}) {
  let delta: { text: string; up: boolean; good: boolean } | null = null;
  if (current != null && previous != null && (isRate || previous !== 0)) {
    const diff = isRate ? current - previous : ((current - previous) / previous) * 100;
    if (Math.abs(diff) >= 0.05) {
      const up = diff > 0;
      delta = {
        text: isRate ? `${Math.abs(diff).toFixed(1)} pts` : `${Math.abs(diff).toFixed(0)}%`,
        up,
        good: lowerIsBetter ? !up : up,
      };
    }
  }
  return (
    <div className="border border-espresso/10 rounded-2xl px-4 py-3.5 bg-cream min-w-0">
      <p className="text-[11px] uppercase tracking-wide font-semibold text-espresso/50 truncate">{label}</p>
      <p className="text-2xl font-semibold text-espresso mt-1 truncate">{value}</p>
      <p className="text-xs mt-1 h-4 flex items-center gap-0.5">
        {delta ? (
          <span className={`inline-flex items-center gap-0.5 font-semibold ${delta.good ? "text-[#0a7a0a]" : "text-cola-red"}`}>
            {delta.up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {delta.text}
          </span>
        ) : (
          <span className="text-espresso/35">,</span>
        )}
        {delta && <span className="text-espresso/40 ml-1">vs previous</span>}
      </p>
    </div>
  );
}

// --- Trend (single series line + area, crosshair tooltip) ------------------

export function TrendChart({
  points,
  format,
  label,
  granularity,
}: {
  points: { date: string; value: number }[];
  format: (n: number) => string;
  label: string;
  granularity: "hour" | "day";
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const height = 220;
  const pad = { top: 12, right: 12, bottom: 26, left: 48 };
  const innerW = Math.max(width - pad.left - pad.right, 10);
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(...points.map((p) => p.value), 0);
  const niceMax = max === 0 ? 1 : niceCeil(max);
  const x = (i: number) => pad.left + (points.length <= 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => pad.top + innerH - (v / niceMax) * innerH;

  const line = points.map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ");
  // The last day/hour is still in progress, so its segment is dashed rather
  // than reading as a real drop.
  const solid = points.length > 1 ? points.slice(0, -1).map((p, i) => `${i ? "L" : "M"}${x(i)},${y(p.value)}`).join(" ") : line;
  const last = points.length - 1;
  const partial =
    points.length > 1 ? `M${x(last - 1)},${y(points[last - 1].value)} L${x(last)},${y(points[last].value)}` : "";
  const area = points.length
    ? `${line} L${x(points.length - 1)},${pad.top + innerH} L${x(0)},${pad.top + innerH} Z`
    : "";
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * niceMax);

  const fmtDate = (d: string) => {
    const date = new Date(granularity === "hour" ? d : `${d}T00:00`);
    return granularity === "hour"
      ? date.toLocaleTimeString(undefined, { hour: "numeric" })
      : date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  };
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 70))));

  const handleMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    setHover(Math.min(points.length - 1, Math.max(0, Math.round(rel * (points.length - 1)))));
  };

  const hovered = hover != null ? points[hover] : null;

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-label={`${label} over time`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke={GRID} />
              <text x={pad.left - 8} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill={INK_MUTED}>
                {compact(t, format)}
              </text>
            </g>
          ))}
          {points.map((p, i) =>
            i % labelEvery === 0 ? (
              <text key={p.date} x={x(i)} y={height - 6} textAnchor="middle" fontSize={11} fill={INK_MUTED}>
                {fmtDate(p.date)}
              </text>
            ) : null,
          )}
          <path d={area} fill={ACCENT} opacity={0.08} />
          <path d={solid} fill="none" stroke={ACCENT} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          {partial && <path d={partial} fill="none" stroke={ACCENT} strokeWidth={2} strokeDasharray="4 4" opacity={0.7} />}
          {hovered && hover != null && (
            <>
              <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} stroke="rgba(60,38,32,0.3)" />
              <circle cx={x(hover)} cy={y(hovered.value)} r={4.5} fill={ACCENT} stroke="#fffffe" strokeWidth={2} />
            </>
          )}
          <rect
            x={pad.left}
            y={pad.top}
            width={innerW}
            height={innerH}
            fill="transparent"
            onPointerMove={handleMove}
            onPointerLeave={() => setHover(null)}
          />
        </svg>
      )}
      {hovered && hover != null && (
        <div
          className="absolute pointer-events-none bg-espresso text-cream rounded-xl px-3 py-2 text-xs shadow-lg whitespace-nowrap"
          style={{
            left: Math.min(Math.max(x(hover) - 60, 0), Math.max(width - 130, 0)),
            top: 0,
          }}
        >
          <p className="font-semibold text-sm">{format(hovered.value)}</p>
          <p className="text-cream/70">
            {label} · {fmtDate(hovered.date)}
            {hover === points.length - 1 ? " (so far)" : ""}
          </p>
        </div>
      )}
    </div>
  );
}

function niceCeil(n: number) {
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const f = n / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

function compact(n: number, format: (n: number) => string) {
  if (n >= 100000) return format(n).replace(/[\d,]+/, `${+(n / 100000).toFixed(1)}L`);
  if (n >= 1000) return format(n).replace(/[\d,]+/, `${+(n / 1000).toFixed(1)}k`);
  return format(n);
}

// --- Bar list (ranked, values always visible) ------------------------------

export function BarList({
  rows,
  format = num,
  secondary,
  emptyText,
}: {
  rows: { label: string; value: number; key?: string }[];
  format?: (n: number) => string;
  secondary?: (row: { label: string; value: number }, index: number) => ReactNode;
  emptyText?: string;
}) {
  if (!rows.length) return <Empty>{emptyText}</Empty>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map((row, i) => (
        <li key={row.key ?? row.label} className="relative flex items-center justify-between gap-3 px-3 py-1.5 text-sm group">
          <span
            className="absolute inset-y-0 left-0 rounded-md bg-cola-red/12 group-hover:bg-cola-red/20 transition-colors"
            style={{ width: `${(row.value / max) * 100}%` }}
          />
          <span className="relative truncate text-espresso/85" title={row.label}>
            {row.label}
          </span>
          <span className="relative shrink-0 flex items-center gap-3 tabular-nums">
            {secondary && <span className="text-xs text-espresso/45">{secondary(row, i)}</span>}
            <span className="font-semibold text-espresso">{format(row.value)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// --- Funnel ---------------------------------------------------------------

export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = steps[0]?.value ?? 0;
  if (!top) return <Empty />;
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((step, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        const stepRate = prev ? (step.value / prev) * 100 : null;
        const share = (step.value / top) * 100;
        return (
          <li key={step.label}>
            <div className="flex items-baseline justify-between text-sm mb-1">
              <span className="text-espresso/80">{step.label}</span>
              <span className="tabular-nums">
                <span className="font-semibold text-espresso">{num(step.value)}</span>
                <span className="text-xs text-espresso/45 ml-2">{share.toFixed(0)}% of visits</span>
              </span>
            </div>
            <div className="h-3 rounded-full bg-espresso/6 overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(share, 0.5)}%`, background: ACCENT, opacity: 1 - i * 0.13 }}
              />
            </div>
            {stepRate != null && (
              <p className="text-[11px] text-espresso/45 mt-1">
                {stepRate.toFixed(0)}% continued · {prev! - step.value} dropped off
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}

// --- Split bar (part-to-whole for 2-4 parts, direct-labelled) --------------

const SPLIT_SHADES = ["#d51f1f", "#3c2620", "#af7a6e", "#9a958f"];

export function SplitBar({ parts }: { parts: { label: string; value: number }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  if (!total) return <Empty />;
  const shown = parts.slice(0, 3);
  const rest = parts.slice(3).reduce((s, p) => s + p.value, 0);
  const all = rest ? [...shown, { label: "Other", value: rest }] : shown;
  return (
    <div>
      <div className="flex h-3.5 rounded-full overflow-hidden gap-[2px]">
        {all.map((p, i) => (
          <div
            key={p.label}
            title={`${p.label}: ${num(p.value)}`}
            style={{ width: `${(p.value / total) * 100}%`, background: SPLIT_SHADES[i] }}
          />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 text-sm">
        {all.map((p, i) => (
          <li key={p.label} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: SPLIT_SHADES[i] }} />
            <span className="text-espresso/75">{p.label}</span>
            <span className="font-semibold text-espresso tabular-nums">{((p.value / total) * 100).toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- Heatmap (sessions by weekday × hour) ----------------------------------

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Heatmap({ grid }: { grid: number[][] }) {
  const [hover, setHover] = useState<{ d: number; h: number } | null>(null);
  const max = Math.max(...grid.flat(), 0);
  if (!max) return <Empty />;
  const hourLabel = (h: number) => (h === 0 ? "12a" : h < 12 ? `${h}a` : h === 12 ? "12p" : `${h - 12}p`);
  return (
    <div>
      <div className="overflow-x-auto">
        <div className="min-w-[520px]">
          {grid.map((row, d) => (
            <div key={d} className="flex items-center gap-[2px] mb-[2px]">
              <span className="w-9 shrink-0 text-[11px] text-espresso/50">{DAYS[d]}</span>
              {row.map((v, h) => (
                <span
                  key={h}
                  onPointerEnter={() => setHover({ d, h })}
                  onPointerLeave={() => setHover(null)}
                  className="flex-1 h-5 rounded-[3px] hover:outline hover:outline-2 hover:outline-espresso/60"
                  style={{ background: v ? ACCENT : "rgba(60,38,32,0.05)", opacity: v ? 0.15 + 0.85 * (v / max) : 1 }}
                />
              ))}
            </div>
          ))}
          <div className="flex gap-[2px] mt-1">
            <span className="w-9 shrink-0" />
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="flex-1 text-[10px] text-espresso/40 text-center">
                {h % 3 === 0 ? hourLabel(h) : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs text-espresso/55 mt-2 h-4">
        {hover
          ? `${DAYS[hover.d]} ${hourLabel(hover.h)}–${hourLabel((hover.h + 1) % 24)}: ${grid[hover.d][hover.h]} visits`
          : "Hover a square to see visits. Darker = busier."}
      </p>
    </div>
  );
}
