import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { ProfitAndLossSnapshot } from "@/types/reports";
import { StatementTableCard } from "@/components/reports/statement-table-card";

export function ProfitLossCard({ snapshot }: { snapshot: ProfitAndLossSnapshot }) {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200 bg-[linear-gradient(135deg,_rgba(15,23,42,1),_rgba(30,41,59,0.95)_60%,_rgba(245,158,11,0.2))] text-white">
        <CardHeader>
          <CardTitle>Profit &amp; Loss</CardTitle>
          <CardDescription className="text-slate-300">
            Year-to-date performance from {snapshot.startDate} to {snapshot.endDate}.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Revenue</p>
            <p className="mt-3 text-2xl font-semibold">{formatCurrency(snapshot.totals.revenue)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Expenses</p>
            <p className="mt-3 text-2xl font-semibold">{formatCurrency(snapshot.totals.expenses)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-300">Net Income</p>
            <p className="mt-3 text-2xl font-semibold">{formatCurrency(snapshot.totals.netIncome)}</p>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-2">
        <StatementTableCard
          title="Revenue"
          description="Recognized operating revenue grouped by account."
          lines={snapshot.revenue}
          totalLabel="Total revenue"
          totalAmount={snapshot.totals.revenue}
        />
        <StatementTableCard
          title="Expenses"
          description="Operating expenses grouped by account."
          lines={snapshot.expenses}
          totalLabel="Total expenses"
          totalAmount={snapshot.totals.expenses}
        />
      </div>
    </div>
  );
}
