"use client";

import Link from "next/link";

import { AgingCard } from "@/components/dashboard/aging-card";
import { CashForecastCard } from "@/components/dashboard/cash-forecast-card";
import { CompositionCard } from "@/components/dashboard/composition-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { TrendVisualCard } from "@/components/dashboard/trend-visual-card";
import { Button } from "@/components/ui/button";
import { useDashboardSnapshot } from "@/hooks/use-dashboard-snapshot";
import type { DashboardSnapshot } from "@/types/dashboard";

export function DashboardOverview({ initialData }: { initialData: DashboardSnapshot }) {
  const { data } = useDashboardSnapshot(initialData);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2.4rem] border border-stone-200/40 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,94,0.16),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.2),_transparent_28%),linear-gradient(135deg,_rgba(18,25,32,0.98),_rgba(28,38,46,0.94)_55%,_rgba(45,58,65,0.92))] p-8 text-white shadow-luxe">
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-stone-300">Active scope</p>
            <h3 className="mt-3 max-w-3xl font-display text-5xl font-semibold tracking-tight">{data.organizationName}</h3>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300">
              {data.entityName
                ? `Operating on ${data.entityName}. Monitor liquidity, receivables, payables, and posted ledger movement from one control surface.`
                : "Organization-wide consolidated view across your active entities and posted accounting activity."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/invoices">Create invoice</Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/bills">Enter bill</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/reports">View reports</Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-stone-300">Ledger rule</p>
              <p className="mt-3 text-lg font-semibold">Every financial document posts through the journal engine.</p>
            </div>
            <div className="rounded-[1.8rem] border border-white/10 bg-white/6 p-5 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-stone-300">Access model</p>
              <p className="mt-3 text-lg font-semibold">Data access is limited to the active organization membership and entity scope.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} change={kpi.change} />
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.8rem] border border-white/60 bg-white/78 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Receivables</p>
          <h4 className="mt-2 text-xl font-semibold">Invoice to cash flow</h4>
          <p className="mt-3 text-sm text-muted-foreground">
            Use the invoice workbench to generate customer-facing documents and post A/R journals immediately.
          </p>
        </div>
        <div className="rounded-[1.8rem] border border-white/60 bg-white/78 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Payables</p>
          <h4 className="mt-2 text-xl font-semibold">Accrue obligations cleanly</h4>
          <p className="mt-3 text-sm text-muted-foreground">
            Enter bills with account coding at the line level so approvals and payment runs inherit the right ledger treatment.
          </p>
        </div>
        <div className="rounded-[1.8rem] border border-white/60 bg-white/78 p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Reporting</p>
          <h4 className="mt-2 text-xl font-semibold">Review financial statements</h4>
          <p className="mt-3 text-sm text-muted-foreground">
            Use reporting to review the Trial Balance, Profit &amp; Loss, and Balance Sheet generated from posted journals.
          </p>
        </div>
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <TrendVisualCard points={data.trendSeries} />
        <AgingCard receivables={data.receivablesAging} payables={data.payablesAging} />
      </section>
      <CashForecastCard points={data.cashForecast} />
      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <CompositionCard revenueSeries={data.revenueSeries} cashSeries={data.cashSeries} />
        <div className="rounded-[2rem] border border-white/60 bg-[radial-gradient(circle_at_top_right,_rgba(14,116,144,0.14),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,1),_rgba(255,251,245,1))] p-6 shadow-soft">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Operational focus</p>
          <h4 className="mt-2 font-display text-3xl font-semibold">Current priorities</h4>
          <div className="mt-5 grid gap-4">
            <div className="rounded-[1.5rem] border border-white/70 bg-white/76 p-5">
              <p className="text-sm font-semibold">Collect aging receivables</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Use the A/R view to follow up on overdue client balances before month-end close.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/70 bg-white/76 p-5">
              <p className="text-sm font-semibold">Review cash concentration</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Cash composition shows whether liquidity is sitting in operating accounts or tied to specific reserves.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/70 bg-white/76 p-5">
              <p className="text-sm font-semibold">Watch margin drift</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Trend mode lets you compare revenue and expense movement before it rolls into the P&amp;L statement.
              </p>
            </div>
          </div>
        </div>
      </section>
      <RecentTransactions items={data.recentTransactions} />
    </div>
  );
}
