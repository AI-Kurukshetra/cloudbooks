import { BalanceSheetCard } from "@/components/reports/balance-sheet-card";
import { ProfitLossCard } from "@/components/reports/profit-loss-card";
import { TrialBalanceCard } from "@/components/reports/trial-balance-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkbenchPanel } from "@/components/workbench/workbench-panel";
import { requireActiveMembership } from "@/services/auth";
import {
  getBalanceSheetSnapshot,
  getProfitAndLossSnapshot,
  getReportCatalog,
  getReportingWorkspaceSummary,
  getTrialBalanceSnapshot,
} from "@/services/reports";

export default async function ReportsPage() {
  const membership = await requireActiveMembership();
  const [reportCatalog, summary, trialBalance, profitAndLoss, balanceSheet] = await Promise.all([
    getReportCatalog(),
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
        description="Every statement on this page is derived from the double-entry ledger in the active tenant scope. Static report shell content has been removed from the deployed surface."
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
          <CardTitle>Reporting Delivery Map</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {reportCatalog.map((report) => (
            <div key={report.id} className="rounded-[1.6rem] border border-stone-200/80 bg-secondary/35 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-base font-semibold">{report.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{report.description}</p>
                </div>
                <Badge variant={report.status === "live" ? "success" : "outline"}>
                  {report.status === "live" ? "Live" : "Queued"}
                </Badge>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                {report.cadence}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
