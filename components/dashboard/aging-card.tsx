"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type AgingBucket = { label: string; value: number };

export function AgingCard({
  receivables,
  payables,
}: {
  receivables: AgingBucket[];
  payables: AgingBucket[];
}) {
  const [mode, setMode] = useState<"receivables" | "payables">("receivables");
  const data = mode === "receivables" ? receivables : payables;
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <Card className="border-white/60 bg-white/80">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>Aging Analysis</CardTitle>
            <CardDescription>Review how open invoices and bills are distributed across due buckets.</CardDescription>
          </div>
          <div className="flex gap-2 rounded-full bg-stone-100/90 p-1">
            <Button size="sm" variant={mode === "receivables" ? "default" : "ghost"} onClick={() => setMode("receivables")}>
              A/R
            </Button>
            <Button size="sm" variant={mode === "payables" ? "default" : "ghost"} onClick={() => setMode("payables")}>
              A/P
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.map((bucket) => (
          <div key={bucket.label}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span>{bucket.label}</span>
              <span className="font-medium">{formatCurrency(bucket.value)}</span>
            </div>
            <div className="h-3 rounded-full bg-stone-100">
              <div
                className="h-3 rounded-full bg-gradient-to-r from-slate-900 via-primary to-amber-400"
                style={{ width: `${(bucket.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
