import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { BalanceSheetSnapshot } from "@/types/reports";
import { StatementTableCard } from "@/components/reports/statement-table-card";

export function BalanceSheetCard({ snapshot }: { snapshot: BalanceSheetSnapshot }) {
  return (
    <div className="space-y-6">
      <Card className="border-slate-200 bg-white/95">
        <CardHeader>
          <CardTitle>Balance Sheet</CardTitle>
          <CardDescription>Financial position as of {snapshot.asOf}.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Assets</p>
            <p className="mt-3 text-2xl font-semibold">{formatCurrency(snapshot.totals.assets)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Liabilities</p>
            <p className="mt-3 text-2xl font-semibold">{formatCurrency(snapshot.totals.liabilities)}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Equity</p>
            <p className="mt-3 text-2xl font-semibold">{formatCurrency(snapshot.totals.equity)}</p>
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-6 xl:grid-cols-3">
        <StatementTableCard
          title="Assets"
          description="Cash, receivables, and other asset balances."
          lines={snapshot.assets}
          totalLabel="Total assets"
          totalAmount={snapshot.totals.assets}
        />
        <StatementTableCard
          title="Liabilities"
          description="Open obligations and accrued liabilities."
          lines={snapshot.liabilities}
          totalLabel="Total liabilities"
          totalAmount={snapshot.totals.liabilities}
        />
        <StatementTableCard
          title="Equity"
          description="Capital and retained results."
          lines={snapshot.equity}
          totalLabel="Total equity"
          totalAmount={snapshot.totals.equity}
        />
      </div>
    </div>
  );
}
