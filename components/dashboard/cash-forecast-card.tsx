"use client";

import { useMemo } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type ForecastPoint = {
  period: string;
  inflows: number;
  outflows: number;
  endingCash: number;
};

export function CashForecastCard({ points }: { points: ForecastPoint[] }) {
  const maxMagnitude = useMemo(() => {
    const values = points.flatMap((point) => [point.inflows, point.outflows, point.endingCash]);
    return Math.max(...values, 1);
  }, [points]);

  return (
    <Card className="border-white/60 bg-white/80">
      <CardHeader>
        <CardTitle>Cash Forecast</CardTitle>
        <CardDescription>
          Projected cash position using current bank balances plus outstanding receivables and payables by due date.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          {points.map((point) => (
            <div key={point.period} className="rounded-[1.4rem] border border-white/70 bg-white/72 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{point.period}</p>
              <p className="mt-3 text-lg font-semibold">{formatCurrency(point.endingCash)}</p>
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>In</span>
                  <span>{formatCurrency(point.inflows)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Out</span>
                  <span>{formatCurrency(point.outflows)}</span>
                </div>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-stone-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600"
                  style={{ width: `${Math.max((point.endingCash / maxMagnitude) * 100, 8)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
