"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, Dot } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatCurrency } from "@/lib/utils";

type TrendPoint = {
  period: string;
  revenue: number;
  expenses: number;
  netIncome: number;
};

type SeriesKey = "revenue" | "expenses" | "netIncome";

const modes: Array<{
  key: SeriesKey;
  label: string;
  stroke: string;
  glow: string;
  fill: string;
}> = [
  {
    key: "revenue",
    label: "Revenue",
    stroke: "#2563eb",
    glow: "rgba(37,99,235,0.24)",
    fill: "url(#trend-revenue-fill)",
  },
  {
    key: "expenses",
    label: "Expenses",
    stroke: "#f97316",
    glow: "rgba(249,115,22,0.22)",
    fill: "url(#trend-expense-fill)",
  },
  {
    key: "netIncome",
    label: "Net income",
    stroke: "#059669",
    glow: "rgba(5,150,105,0.22)",
    fill: "url(#trend-net-fill)",
  },
];

function buildLinePath(values: number[], width: number, height: number, paddingX: number, paddingY: number, max: number) {
  if (!values.length) {
    return "";
  }

  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;
  const step = values.length > 1 ? innerWidth / (values.length - 1) : 0;

  return values
    .map((value, index) => {
      const x = paddingX + step * index;
      const y = paddingY + innerHeight - (value / max) * innerHeight;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildAreaPath(linePath: string, width: number, height: number, paddingX: number, paddingY: number) {
  if (!linePath) {
    return "";
  }

  return `${linePath} L ${width - paddingX} ${height - paddingY} L ${paddingX} ${height - paddingY} Z`;
}

export function TrendVisualCard({ points }: { points: TrendPoint[] }) {
  const [mode, setMode] = useState<SeriesKey>("netIncome");
  const [activeIndex, setActiveIndex] = useState(points.length ? points.length - 1 : 0);

  const activeMode = modes.find((item) => item.key === mode)!;

  const chart = useMemo(() => {
    const width = 760;
    const height = 320;
    const paddingX = 28;
    const paddingY = 24;
    const currentValues = points.map((point) => Math.max(point[mode], 0));
    const allValues = points.flatMap((point) => [point.revenue, point.expenses, Math.max(point.netIncome, 0)]);
    const max = Math.max(...allValues, 1);
    const innerWidth = width - paddingX * 2;
    const innerHeight = height - paddingY * 2;
    const step = points.length > 1 ? innerWidth / (points.length - 1) : 0;

    const series = modes.map((item) => {
      const values = points.map((point) => Math.max(point[item.key], 0));
      const linePath = buildLinePath(values, width, height, paddingX, paddingY, max);
      const areaPath = buildAreaPath(linePath, width, height, paddingX, paddingY);

      return {
        ...item,
        values,
        linePath,
        areaPath,
      };
    });

    const selectedSeries = series.find((item) => item.key === mode)!;
    const index = Math.min(activeIndex, Math.max(points.length - 1, 0));
    const point = points[index];
    const x = paddingX + step * index;
    const y = paddingY + innerHeight - ((selectedSeries.values[index] ?? 0) / max) * innerHeight;
    const deltas = points.length > 1
      ? {
          revenue: point.revenue - (points[index - 1]?.revenue ?? 0),
          expenses: point.expenses - (points[index - 1]?.expenses ?? 0),
          netIncome: point.netIncome - (points[index - 1]?.netIncome ?? 0),
        }
      : { revenue: 0, expenses: 0, netIncome: 0 };

    const yAxis = Array.from({ length: 4 }, (_, idx) => {
      const ratio = idx / 3;
      const value = Math.round((max - max * ratio) / 1000) * 1000;
      const yLine = paddingY + innerHeight * ratio;
      return { value, yLine };
    });

    return {
      width,
      height,
      paddingX,
      paddingY,
      max,
      series,
      selectedSeries,
      focus: {
        index,
        point,
        x,
        y,
        deltas,
      },
      yAxis,
    };
  }, [activeIndex, mode, points]);

  if (!points.length) {
    return (
      <Card className="border-white/60 bg-white/80">
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
          <CardDescription>No posted activity available yet.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border-white/60 bg-[linear-gradient(180deg,_rgba(255,255,255,0.92),_rgba(247,249,252,0.96))]">
      <CardHeader className="border-b border-stone-200/70">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Compare six months of revenue, expense, and net income movement from posted ledger activity.</CardDescription>
          </div>
          <div className="flex gap-2 rounded-full bg-stone-100/90 p-1">
            {modes.map((item) => (
              <Button
                key={item.key}
                size="sm"
                type="button"
                variant={item.key === mode ? "default" : "ghost"}
                onClick={() => setMode(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.8rem] border border-white/70 bg-[linear-gradient(180deg,_rgba(248,250,252,1),_rgba(255,255,255,0.98))] p-4">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{chart.focus.point.period}</p>
                <p className="mt-2 text-3xl font-semibold">{formatCurrency(chart.focus.point[mode])}</p>
              </div>
              <div
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: activeMode.glow,
                  color: activeMode.stroke,
                }}
              >
                {activeMode.label}
              </div>
            </div>
            <div className="relative">
              <svg viewBox={`0 0 ${chart.width} ${chart.height}`} className="h-[20rem] w-full">
                <defs>
                  <linearGradient id="trend-revenue-fill" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(37,99,235,0.18)" />
                    <stop offset="100%" stopColor="rgba(37,99,235,0.01)" />
                  </linearGradient>
                  <linearGradient id="trend-expense-fill" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(249,115,22,0.16)" />
                    <stop offset="100%" stopColor="rgba(249,115,22,0.01)" />
                  </linearGradient>
                  <linearGradient id="trend-net-fill" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="rgba(5,150,105,0.18)" />
                    <stop offset="100%" stopColor="rgba(5,150,105,0.01)" />
                  </linearGradient>
                </defs>

                {chart.yAxis.map((tick) => (
                  <g key={tick.yLine}>
                    <line
                      x1={chart.paddingX}
                      x2={chart.width - chart.paddingX}
                      y1={tick.yLine}
                      y2={tick.yLine}
                      stroke="rgba(148,163,184,0.18)"
                      strokeDasharray="4 8"
                    />
                    <text x={6} y={tick.yLine + 4} fill="rgb(100 116 139)" fontSize="11">
                      {formatCurrency(tick.value)}
                    </text>
                  </g>
                ))}

                {chart.series.map((series) => (
                  <g key={series.key}>
                    {series.key === mode ? <path d={series.areaPath} fill={series.fill} /> : null}
                    <path
                      d={series.linePath}
                      fill="none"
                      stroke={series.stroke}
                      strokeOpacity={series.key === mode ? 1 : 0.32}
                      strokeWidth={series.key === mode ? 4.5 : 2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                ))}

                <line
                  x1={chart.focus.x}
                  x2={chart.focus.x}
                  y1={chart.paddingY}
                  y2={chart.height - chart.paddingY}
                  stroke="rgba(15,23,42,0.14)"
                  strokeDasharray="5 6"
                />

                {chart.series.map((series) => {
                  const value = series.values[chart.focus.index] ?? 0;
                  const y =
                    chart.paddingY +
                    (chart.height - chart.paddingY * 2) -
                    (value / chart.max) * (chart.height - chart.paddingY * 2);

                  return (
                    <circle
                      key={series.key}
                      cx={chart.focus.x}
                      cy={y}
                      r={series.key === mode ? 6 : 4}
                      fill={series.stroke}
                      stroke="white"
                      strokeWidth={series.key === mode ? 3 : 2}
                    />
                  );
                })}

                {points.map((point, index) => {
                  const x =
                    chart.paddingX +
                    (points.length > 1
                      ? ((chart.width - chart.paddingX * 2) / (points.length - 1)) * index
                      : 0);

                  return (
                    <rect
                      key={point.period}
                      x={x - 24}
                      y={chart.paddingY}
                      width={48}
                      height={chart.height - chart.paddingY * 2}
                      fill="transparent"
                      onMouseEnter={() => setActiveIndex(index)}
                    />
                  );
                })}
              </svg>
              <div className="mt-3 grid grid-cols-6 gap-2 text-center text-xs text-muted-foreground">
                {points.map((point, index) => (
                  <button
                    key={point.period}
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onFocus={() => setActiveIndex(index)}
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      "rounded-full px-2 py-1 transition",
                      index === chart.focus.index ? "bg-slate-900 text-white" : "hover:bg-stone-100",
                    )}
                  >
                    {point.period}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.8rem] border border-white/70 bg-white/86 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Focused month</p>
              <h4 className="mt-2 text-2xl font-semibold">{chart.focus.point.period}</h4>
              <div className="mt-4 space-y-3">
                {modes.map((item) => {
                  const delta = chart.focus.deltas[item.key];
                  const direction = delta >= 0 ? "+" : "";
                  return (
                    <div key={item.key} className="flex items-center justify-between rounded-[1.3rem] bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Dot className="h-6 w-6" style={{ color: item.stroke }} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(chart.focus.point[item.key])}</p>
                        <p className="text-xs text-muted-foreground">
                          {direction}
                          {formatCurrency(Math.abs(delta))}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-white/70 bg-[linear-gradient(180deg,_rgba(15,23,42,0.98),_rgba(30,41,59,0.96))] p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Trend reading</p>
              <p className="mt-3 text-xl font-semibold">Use the active series to compare margin shape instead of isolated totals.</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Hover across the timeline to inspect the month-by-month operating profile and see how revenue, expense, and net income move together.
              </p>
              <div className="mt-5 flex items-center gap-2 text-sm text-emerald-300">
                <ArrowUpRight className="h-4 w-4" />
                Interactive comparison view enabled
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
