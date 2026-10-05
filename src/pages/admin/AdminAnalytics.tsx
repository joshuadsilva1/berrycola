import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import AdminNav from "../../components/AdminNav";
import {
  BarList,
  Card,
  Empty,
  Funnel,
  Heatmap,
  SplitBar,
  StatTile,
  TrendChart,
  duration,
  inr,
  num,
} from "../../components/admin/charts";
import {
  fetchAnalytics,
  fetchLiveAnalytics,
  type AnalyticsRange,
  type AnalyticsReport,
  type LiveAnalytics,
} from "../../lib/api";
import { STATUS_LABELS } from "../../lib/orderStatus";

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "12m", label: "12 months" },
];

const TREND_METRICS = [
  { key: "visitors", label: "Visitors", format: num },
  { key: "pageviews", label: "Page views", format: num },
  { key: "orders", label: "Orders", format: num },
  { key: "revenue", label: "Revenue", format: inr },
] as const;

const pct = (n: number | null) => (n == null ? "—" : `${n}%`);

export default function AdminAnalytics() {
  const [range, setRange] = useState<AnalyticsRange>(() => {
    try {
      return (localStorage.getItem("bc-admin-range") as AnalyticsRange) || "30d";
    } catch {
      return "30d";
    }
  });
  const [report, setReport] = useState<AnalyticsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<(typeof TREND_METRICS)[number]["key"]>("visitors");

  useEffect(() => {
    let cancelled = false;
    fetchAnalytics(range)
      .then((data) => {
        if (cancelled) return;
        setReport(data);
        setError(null);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [range]);

  const chooseRange = (value: AnalyticsRange) => {
    if (value === range) return;
    setLoading(true);
    setRange(value);
    try {
      localStorage.setItem("bc-admin-range", value);
    } catch {
      // Not remembering the choice is fine.
    }
  };

  const trendMetric = TREND_METRICS.find((m) => m.key === metric)!;
  const trendPoints = useMemo(
    () => (report?.timeseries ?? []).map((row) => ({ date: row.date, value: row[metric] })),
    [report, metric],
  );

  const k = report?.kpis;
  const p = report?.previous;

  return (
    <div className="min-h-screen px-5 sm:px-8 pt-28 pb-20 max-w-7xl mx-auto">
      <AdminNav />

      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl text-espresso">Analytics</h1>
          <p className="text-sm text-espresso/50 mt-1">
            Your own visits while signed in as admin aren't counted.
          </p>
        </div>
        <div className="flex flex-wrap gap-1 bg-espresso/5 rounded-full p-1" role="radiogroup" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r.value}
              role="radio"
              aria-checked={range === r.value}
              onClick={() => chooseRange(r.value)}
              className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                range === r.value ? "bg-cream text-espresso shadow-sm" : "text-espresso/55 hover:text-espresso"
              }`}
            >
              {range === r.value && <Check size={13} strokeWidth={3} />}
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {error && !report && <p className="text-cola-red text-sm">Couldn't load analytics: {error}</p>}
      {!report && loading && <p className="text-espresso/50 text-sm">Crunching numbers…</p>}

      {report && k && p && (
        <div className={`flex flex-col gap-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
          {/* Headline numbers */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatTile label="Revenue" value={inr(k.revenue)} current={k.revenue} previous={p.revenue} />
            <StatTile label="Orders" value={num(k.orders)} current={k.orders} previous={p.orders} />
            <StatTile
              label="Avg order value"
              value={k.avgOrderValue != null ? inr(k.avgOrderValue) : "—"}
              current={k.avgOrderValue}
              previous={p.avgOrderValue}
            />
            <StatTile
              label="Conversion rate"
              value={pct(k.conversionRate)}
              current={k.conversionRate}
              previous={p.conversionRate}
              isRate
            />
            <StatTile label="Visitors" value={num(k.visitors)} current={k.visitors} previous={p.visitors} />
            <StatTile label="Sessions" value={num(k.sessions)} current={k.sessions} previous={p.sessions} />
            <StatTile label="Page views" value={num(k.pageviews)} current={k.pageviews} previous={p.pageviews} />
            <StatTile
              label="Pages / session"
              value={k.pagesPerSession != null ? String(k.pagesPerSession) : "—"}
              current={k.pagesPerSession}
              previous={p.pagesPerSession}
            />
            <StatTile
              label="Avg time on site"
              value={duration(k.avgSessionSeconds)}
              current={k.avgSessionSeconds}
              previous={p.avgSessionSeconds}
            />
            <StatTile
              label="Bounce rate"
              value={pct(k.bounceRate)}
              current={k.bounceRate}
              previous={p.bounceRate}
              lowerIsBetter
              isRate
            />
            <StatTile
              label="Add-to-bag rate"
              value={pct(k.addToCartRate)}
              current={k.addToCartRate}
              previous={p.addToCartRate}
              isRate
            />
            <StatTile
              label="Bag abandonment"
              value={pct(k.cartAbandonmentRate)}
              current={k.cartAbandonmentRate}
              previous={p.cartAbandonmentRate}
              lowerIsBetter
              isRate
            />
          </div>

          <LivePanel />

          {/* Trend */}
          <Card
            title={`${trendMetric.label} over time`}
            subtitle={report.granularity === "hour" ? "By hour, today" : "By day"}
            action={
              <div className="flex flex-wrap gap-1">
                {TREND_METRICS.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setMetric(m.key)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      metric === m.key ? "bg-espresso text-cream" : "text-espresso/55 hover:bg-espresso/5"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            }
          >
            <TrendChart
              points={trendPoints}
              format={trendMetric.format}
              label={trendMetric.label}
              granularity={report.granularity}
            />
          </Card>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Shopping funnel" subtitle="Visits that reached each step">
              <Funnel steps={report.funnel} />
            </Card>
            <Card title="Where visitors come from" subtitle="Sessions · orders · conversion">
              <BarList
                rows={report.sources.map((s) => ({ label: s.label, value: s.sessions }))}
                secondary={(_, i) => {
                  const s = report.sources[i];
                  return `${s.orders} orders · ${pct(s.conversionRate)}`;
                }}
                emptyText="No visits yet. Share links with ?utm_source=instagram to see campaigns here."
              />
            </Card>
          </div>

          {/* Products */}
          <Card title="Products" subtitle="Views, add-to-bags and sales per product — click a column to sort">
            <ProductTable rows={report.products} />
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            <Card title="Revenue by category">
              <BarList rows={report.categoryRevenue} format={inr} />
            </Card>
            <Card title="Photos customers look at" subtitle="Named carousel photos, by views">
              <BarList rows={report.imageViews} emptyText="No carousel swipes yet." />
            </Card>
            <Card title="Options" subtitle="Picked on the product page · units sold">
              {report.optionPicks.length || report.optionsSold.length ? (
                <div className="flex flex-col gap-5">
                  <BarList rows={report.optionPicks} emptyText="No options picked yet." />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-espresso/50 mb-2">Units sold</p>
                    <BarList rows={report.optionsSold} emptyText="No options sold yet." />
                  </div>
                </div>
              ) : (
                <Empty />
              )}
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Top pages" subtitle="Views · unique visitors">
              <BarList
                rows={report.pages.map((pg) => ({ label: pg.path, value: pg.views }))}
                secondary={(_, i) => `${report.pages[i].visitors} visitors`}
              />
            </Card>
            <Card title="Landing pages" subtitle="First page of each visit">
              <BarList rows={report.landingPages} />
            </Card>
          </div>

          <Card title="When people shop" subtitle="Visits by day and hour (India time)">
            <Heatmap grid={report.heatmap} />
          </Card>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card title="Devices">
              <SplitBar parts={report.devices} />
            </Card>
            <Card title="New vs returning">
              <SplitBar
                parts={[
                  { label: "New", value: report.newVsReturning.new },
                  { label: "Returning", value: report.newVsReturning.returning },
                ]}
              />
            </Card>
            <Card title="Browsers">
              <BarList rows={report.browsers.slice(0, 5)} />
            </Card>
            <Card title="Operating systems">
              <BarList rows={report.os.slice(0, 5)} />
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Countries" subtitle="Filled in once the site is behind Cloudflare or Vercel">
              <BarList rows={report.countries} emptyText="No country data yet." />
            </Card>
            <Card title="Campaigns" subtitle="From utm_campaign links">
              <BarList rows={report.campaigns} emptyText="No campaign links used yet." />
            </Card>
          </div>

          {/* Orders & customers */}
          <div className="grid lg:grid-cols-3 gap-6">
            <Card title="Orders by status" action={<Link to="/admin/orders" className="text-xs font-semibold text-cola-red hover:underline">Manage →</Link>}>
              <BarList
                rows={report.orderStatus.map((s) => ({
                  label: STATUS_LABELS[s.label as keyof typeof STATUS_LABELS] ?? s.label,
                  value: s.value,
                }))}
              />
            </Card>
            <Card title="Fulfilment">
              <dl className="grid grid-cols-1 gap-4">
                <Metric label="Waiting to ship" value={num(report.fulfilment.awaitingShipment)} />
                <Metric label="Avg time to ship" value={hours(report.fulfilment.avgHoursToShip)} />
                <Metric label="Avg time to deliver" value={hours(report.fulfilment.avgHoursToDeliver)} />
              </dl>
            </Card>
            <Card title="Customers" action={<Link to="/admin/customers" className="text-xs font-semibold text-cola-red hover:underline">All →</Link>}>
              <dl className="grid grid-cols-2 gap-4">
                <Metric label="Total accounts" value={num(report.customers.total)} />
                <Metric label="New this period" value={num(report.customers.newInRange)} />
                <Metric label="Have ordered" value={num(report.customers.withOrders)} />
                <Metric label="Repeat buyers" value={`${num(report.customers.repeat)} (${pct(report.customers.repeatRate)})`} />
              </dl>
            </Card>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card title="Top customers" subtitle="All-time spend">
              {report.customers.top.length ? (
                <ul className="flex flex-col divide-y divide-espresso/8">
                  {report.customers.top.map((c) => (
                    <li key={(c.email ?? "") + c.name} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                      <span className="min-w-0">
                        <span className="block text-espresso truncate">{c.name}</span>
                        <span className="block text-xs text-espresso/45 truncate">{c.email}</span>
                      </span>
                      <span className="text-right shrink-0 tabular-nums">
                        <span className="block font-semibold text-espresso">{inr(c.spend)}</span>
                        <span className="block text-xs text-espresso/45">{c.orders} orders</span>
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <Empty>No orders yet.</Empty>
              )}
            </Card>
            <Card title="Sign-ups & messages" action={<Link to="/admin/messages" className="text-xs font-semibold text-cola-red hover:underline">Read →</Link>}>
              <dl className="grid grid-cols-2 gap-4">
                <Metric label="Account sign-ups" value={num(k.signUps)} sub="this period" />
                <Metric label="Newsletter sign-ups" value={num(k.newsletterSignups)} sub="this period" />
                <Metric label="Contact messages" value={num(k.contactMessages)} sub="this period" />
                <Metric label="Newsletter list" value={num(report.totals.newsletterSubscribers)} sub="all time" />
                <Metric label="Products" value={num(report.totals.products)} sub={`${report.totals.outOfStock} out of stock`} />
              </dl>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

function hours(h: number | null) {
  if (h == null) return "—";
  if (h < 48) return `${h.toFixed(1)} hrs`;
  return `${(h / 24).toFixed(1)} days`;
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide font-semibold text-espresso/50">{label}</dt>
      <dd className="text-xl font-semibold text-espresso mt-0.5">{value}</dd>
      {sub && <dd className="text-xs text-espresso/45">{sub}</dd>}
    </div>
  );
}

// --- Product table -------------------------------------------------------------

type ProductRow = AnalyticsReport["products"][number];
const PRODUCT_COLUMNS: { key: keyof ProductRow; label: string; format: (r: ProductRow) => string }[] = [
  { key: "views", label: "Views", format: (r) => num(r.views) },
  { key: "viewers", label: "Viewers", format: (r) => num(r.viewers) },
  { key: "addToCarts", label: "Added to bag", format: (r) => num(r.addToCarts) },
  { key: "cartRate", label: "View → bag", format: (r) => pct(r.cartRate) },
  { key: "units", label: "Units sold", format: (r) => num(r.units) },
  { key: "revenue", label: "Revenue", format: (r) => inr(r.revenue) },
];

function ProductTable({ rows }: { rows: ProductRow[] }) {
  const [sortKey, setSortKey] = useState<keyof ProductRow>("revenue");
  if (!rows.length) return <Empty />;
  const sorted = [...rows].sort((a, b) => Number(b[sortKey] ?? -1) - Number(a[sortKey] ?? -1));
  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full text-sm min-w-[640px]">
        <thead>
          <tr className="text-left text-[11px] uppercase tracking-wide text-espresso/50">
            <th className="font-semibold px-2 pb-2">Product</th>
            {PRODUCT_COLUMNS.map((c) => (
              <th key={c.key} className="font-semibold px-2 pb-2 text-right">
                <button
                  onClick={() => setSortKey(c.key)}
                  className={`uppercase tracking-wide ${sortKey === c.key ? "text-cola-red" : "hover:text-espresso"}`}
                >
                  {c.label}
                  {sortKey === c.key ? " ↓" : ""}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-espresso/8">
          {sorted.map((r) => (
            <tr key={r.id} className="hover:bg-espresso/3">
              <td className="px-2 py-2">
                <Link to={`/product/${r.id}`} className="flex items-center gap-2.5 hover:text-cola-red">
                  <span className="w-8 h-8 rounded-lg overflow-hidden bg-espresso/5 shrink-0">
                    {r.imageUrl && <img src={r.imageUrl} alt="" className="w-full h-full object-cover" />}
                  </span>
                  <span className="truncate">{r.name}</span>
                </Link>
              </td>
              {PRODUCT_COLUMNS.map((c) => (
                <td
                  key={c.key}
                  className={`px-2 py-2 text-right tabular-nums ${sortKey === c.key ? "font-semibold text-espresso" : "text-espresso/75"}`}
                >
                  {c.format(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// --- Live -------------------------------------------------------------------------

const LIVE_REFRESH_MS = 15000;

function describe(e: LiveAnalytics["feed"][number]) {
  const money = e.value != null ? ` · ${inr(e.value)}` : "";
  switch (e.name) {
    case "page_view":
      return `Viewed ${e.path ?? "a page"}`;
    case "product_view":
      return `Looked at ${e.product ?? "a product"}`;
    case "image_view":
      return `Swiped to "${e.label}" on ${e.product ?? "a product"}`;
    case "option_select":
      return `Picked "${e.label}" on ${e.product ?? "a product"}`;
    case "add_to_cart":
      return `Added ${e.product ?? "a product"} to bag${money}`;
    case "remove_from_cart":
      return `Removed ${e.product ?? "a product"} from bag`;
    case "cart_open":
      return "Opened their bag";
    case "checkout_start":
      return `Started checkout${money}`;
    case "order_placed":
      return `Placed an order${money} 🎉`;
    case "sign_up":
      return "Created an account";
    case "sign_in":
      return "Signed in";
    case "newsletter_signup":
      return "Joined the newsletter";
    case "contact_submit":
      return "Sent a contact message";
    case "shop_filter":
      return "Filtered the shop";
    default:
      return e.name;
  }
}

function ago(iso: string) {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function LivePanel() {
  const [live, setLive] = useState<LiveAnalytics | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchLiveAnalytics()
        .then((data) => !cancelled && setLive(data))
        .catch(() => {});
    load();
    const timer = setInterval(load, LIVE_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!live) return null;

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <Card title="Right now" subtitle="Visitors active in the last 5 minutes">
        <p className="flex items-center gap-3">
          <span className="relative flex w-3 h-3">
            {live.activeVisitors > 0 && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#0ca30c] opacity-60 animate-ping" />
            )}
            <span className={`relative inline-flex w-3 h-3 rounded-full ${live.activeVisitors ? "bg-[#0ca30c]" : "bg-espresso/20"}`} />
          </span>
          <span className="text-5xl font-semibold text-espresso">{live.activeVisitors}</span>
          <span className="text-sm text-espresso/50">{live.activeVisitors === 1 ? "person" : "people"} on the site</span>
        </p>
        {live.activePages.length > 0 && (
          <div className="mt-5">
            <BarList rows={live.activePages} />
          </div>
        )}
      </Card>
      <Card title="Live activity" subtitle="Updates every 15 seconds" className="lg:col-span-2">
        {live.feed.length ? (
          <ul className="flex flex-col divide-y divide-espresso/8 max-h-72 overflow-y-auto pr-1">
            {live.feed.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className={`min-w-0 truncate ${e.name === "order_placed" ? "font-semibold text-cola-red" : "text-espresso/85"}`}>
                  {describe(e)}
                </span>
                <span className="shrink-0 text-xs text-espresso/45 tabular-nums">
                  {[e.device, e.country, e.source !== "direct" ? `via ${e.source}` : null].filter(Boolean).join(" · ")}
                  {" · "}
                  {ago(e.at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <Empty>No activity yet — it'll show up here as soon as someone visits.</Empty>
        )}
      </Card>
    </div>
  );
}
