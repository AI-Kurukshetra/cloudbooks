"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type SeriesItem = { label: string; value: number };

export function CompositionCard({
  revenueSeries,
  cashSeries,
}: {
  revenueSeries: SeriesItem[];
  cashSeries: SeriesItem[];
}) {
  const [mode, setMode] = useState<"revenue" | "cash">("revenue");
  const items = mode === "revenue" ? revenueSeries : cashSeries;
  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let cumulative = 0;

  const segments = items.map((item) => {
    const start = (cumulative / total) * 100;
    cumulative += item.value;
    const end = (cumulative / total) * 100;
    return { ...item, start, end };
  });

  return (
    <Card className="border-white/60 bg-white/80">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Composition View</CardTitle>
            <CardDescription>Switch between current revenue mix and cash distribution.</CardDescription>
          </div>
          <div className="flex gap-2 rounded-full bg-stone-100/90 p-1">
            <Button size="sm" variant={mode === "revenue" ? "default" : "ghost"} onClick={() => setMode("revenue")}>
              Revenue
            </Button>
            <Button size="sm" variant={mode === "cash" ? "default" : "ghost"} onClick={() => setMode("cash")}>
              Cash
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="flex items-center justify-center">
          <div
            className="relative h-44 w-44 rounded-full"
            style={{
              background: `conic-gradient(
                rgb(37,99,235) ${segments[0]?.end ?? 0}%,
                rgb(14,165,233) ${segments[0]?.end ?? 0}% ${segments[1]?.end ?? segments[0]?.end ?? 0}%,
                rgb(245,158,11) ${segments[1]?.end ?? segments[0]?.end ?? 0}% ${segments[2]?.end ?? segments[1]?.end ?? 0}%,
                rgb(16,185,129) ${segments[2]?.end ?? segments[1]?.end ?? 0}% 100%
              )`,
            }}
          >
            <div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-white/95 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
              <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">{mode}</span>
              <span className="mt-2 text-xl font-semibold">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.label} className="rounded-[1.4rem] border border-white/70 bg-white/72 p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: ["rgb(37,99,235)", "rgb(14,165,233)", "rgb(245,158,11)", "rgb(16,185,129)"][index % 4],
                    }}
                  />
                  <span className="font-medium">{item.label}</span>
                </div>
                <div className="text-right text-sm">
                  <div className="font-semibold">{formatCurrency(item.value)}</div>
                  <div className="text-muted-foreground">{((item.value / total) * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
