import { BalanceSheetCard } from "@/components/reports/balance-sheet-card";
import { ProfitLossCard } from "@/components/reports/profit-loss-card";
import { TrialBalanceCard } from "@/components/reports/trial-balance-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import {
  getBalanceSheetSnapshot,
  getProfitAndLossSnapshot,
  getReportingWorkspaceSummary,
  getTrialBalanceSnapshot,
} from "@/services/reports";

export default async function ReportsPage() {
  const membership = await requireActiveMembership();
  const [summary, trialBalance, profitAndLoss, balanceSheet] = await Promise.all([
    getReportingWorkspaceSummary(membership),
    getTrialBalanceSnapshot(membership),
    getProfitAndLossSnapshot(membership),
    getBalanceSheetSnapshot(membership),
  ]);

  return (
    <div className="space-y-6">
      <WorkbenchPanel
        eyebrow="Reporting"
        title="Live statements from posted journals"
        description="Every statement on this page is derived from posted journals in the active tenant scope."
      >
        <div className="grid gap-4 lg:grid-cols-4">
          <Card className="border-white/60 bg-white/80">
            <CardHeader className="pb-2">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Scope</p>
              <CardTitle className="text-xl">{summary.entityScopeLabel}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {summary.activeEntityCount} active entit{summary.activeEntityCount === 1 ? "y" : "ies"} in organization
            </CardContent>
          </Card>
          <Card className="border-white/60 bg-white/80">
            <CardHeader className="pb-2">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Chart</p>
              <CardTitle className="text-xl">{summary.totalAccounts}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Active ledger accounts feeding statements
            </CardContent>
          </Card>
          <Card className="border-white/60 bg-white/80">
            <CardHeader className="pb-2">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Periods</p>
              <CardTitle className="text-xl">{summary.openPeriods}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Open fiscal periods available for posting
            </CardContent>
          </Card>
          <Card className="border-white/60 bg-white/80">
            <CardHeader className="pb-2">
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Posted Journals</p>
              <CardTitle className="text-xl">{summary.postedJournalCount}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Posted entries included in reporting snapshots
            </CardContent>
          </Card>
        </div>
      </WorkbenchPanel>
      <ProfitLossCard snapshot={profitAndLoss} />
      <BalanceSheetCard snapshot={balanceSheet} />
      <TrialBalanceCard snapshot={trialBalance} />
      <Card>
        <CardHeader>
          <CardTitle>Reporting Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.6rem] border border-stone-200/80 bg-secondary/35 p-4">
            <p className="text-base font-semibold">Posting basis</p>
            <p className="mt-2 text-sm text-muted-foreground">Reports include posted journal entries only.</p>
          </div>
          <div className="rounded-[1.6rem] border border-stone-200/80 bg-secondary/35 p-4">
            <p className="text-base font-semibold">Tenant scope</p>
            <p className="mt-2 text-sm text-muted-foreground">All queries are filtered to the active organization membership and entity scope.</p>
          </div>
          <div className="rounded-[1.6rem] border border-stone-200/80 bg-secondary/35 p-4">
            <p className="text-base font-semibold">Statement date</p>
            <p className="mt-2 text-sm text-muted-foreground">P&amp;L is year-to-date. Trial Balance and Balance Sheet are point-in-time snapshots.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
