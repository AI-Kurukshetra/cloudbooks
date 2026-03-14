"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type TrendPoint = {
  period: string;
  revenue: number;
  expenses: number;
  netIncome: number;
};

const modes = [
  { key: "revenue", label: "Revenue", tone: "from-sky-500 to-blue-700" },
  { key: "expenses", label: "Expenses", tone: "from-amber-400 to-orange-600" },
  { key: "netIncome", label: "Net Income", tone: "from-emerald-400 to-emerald-700" },
] as const;

export function TrendVisualCard({ points }: { points: TrendPoint[] }) {
  const [mode, setMode] = useState<(typeof modes)[number]["key"]>("revenue");

  const chart = useMemo(() => {
    const values = points.map((point) => point[mode]);
    const max = Math.max(...values, 1);
    const width = 420;
    const height = 180;
    const step = points.length > 1 ? width / (points.length - 1) : width;
    const path = points
      .map((point, index) => {
        const x = index * step;
        const y = height - (point[mode] / max) * 150 - 12;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");

    return { values, max, path, latest: values.at(-1) ?? 0 };
  }, [mode, points]);

  const activeMode = modes.find((item) => item.key === mode)!;

  return (
    <Card className="border-white/60 bg-white/80">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Toggle through six-month operating movement driven by posted journals.</CardDescription>
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
      <CardContent className="space-y-5">
        <div className="rounded-[1.6rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(255,255,255,0.92),_rgba(240,249,255,0.84))] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{activeMode.label}</p>
          <p className="mt-3 text-3xl font-semibold">{formatCurrency(chart.latest)}</p>
        </div>
        <div className="overflow-hidden rounded-[1.8rem] bg-[linear-gradient(180deg,_rgba(248,250,252,1),_rgba(255,255,255,0.96))] p-4">
          <svg viewBox="0 0 420 180" className="h-48 w-full">
            <defs>
              <linearGradient id="trend-fill" x1="0%" x2="0%" y1="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(59,130,246,0.28)" />
                <stop offset="100%" stopColor="rgba(59,130,246,0.02)" />
              </linearGradient>
            </defs>
            {[0, 1, 2, 3].map((line) => (
              <line
                key={line}
                x1="0"
                x2="420"
                y1={20 + line * 40}
                y2={20 + line * 40}
                stroke="rgba(148,163,184,0.22)"
                strokeDasharray="4 6"
              />
            ))}
            <path d={`${chart.path} L 420 180 L 0 180 Z`} fill="url(#trend-fill)" />
            <path d={chart.path} fill="none" stroke="url(#trend-line)" strokeWidth="4" />
            <defs>
              <linearGradient id="trend-line" x1="0%" x2="100%" y1="0%" y2="0%">
                <stop offset="0%" stopColor="rgb(37,99,235)" />
                <stop offset="100%" stopColor="rgb(245,158,11)" />
              </linearGradient>
            </defs>
            {points.map((point, index) => {
              const x = points.length > 1 ? (420 / (points.length - 1)) * index : 210;
              const y = 180 - ((point[mode] / chart.max) * 150 + 12);
              return <circle key={point.period} cx={x} cy={y} r="5" fill="rgb(15,23,42)" />;
            })}
          </svg>
          <div className="mt-3 grid grid-cols-6 gap-2 text-center text-xs text-muted-foreground">
            {points.map((point) => (
              <span key={point.period}>{point.period}</span>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
