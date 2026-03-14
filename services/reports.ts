import { createServerSupabaseClient } from "@/supabase/server";
import type { MembershipContext } from "@/services/auth";
import type {
  BalanceSheetSnapshot,
  ProfitAndLossSnapshot,
  ReportCatalogItem,
  ReportingWorkspaceSummary,
  StatementLine,
  TrialBalanceRow,
  TrialBalanceSnapshot,
} from "@/types/reports";

type ReportAccount = {
  id: string;
  account_code: string;
  name: string;
  account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
  normal_balance: "debit" | "credit";
};

type ReportJournalLine = {
  account_id?: string;
  debit_amount?: number | string | null;
  credit_amount?: number | string | null;
};

type ReportJournalEntry = {
  journal_lines?: ReportJournalLine[];
};

type LedgerBalance = {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: ReportAccount["account_type"];
  normalBalance: ReportAccount["normal_balance"];
  debit: number;
  credit: number;
  balance: number;
};

function entityFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  entityId: string | null,
) {
  return entityId ? query.eq("entity_id", entityId) : query;
}

function statementAmount(balance: LedgerBalance) {
  return balance.normalBalance === "debit" ? balance.debit - balance.credit : balance.credit - balance.debit;
}

async function getLedgerBalances(
  membership: MembershipContext,
  options?: { startDate?: string; endDate?: string },
): Promise<LedgerBalance[]> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;

  let entriesQuery = entityFilter(
    db
      .from("journal_entries")
      .select("journal_lines(account_id, debit_amount, credit_amount)")
      .eq("organization_id", membership.organizationId)
      .eq("status", "posted"),
    membership.entityId,
  );

  if (options?.startDate) {
    entriesQuery = entriesQuery.gte("entry_date", options.startDate);
  }

  if (options?.endDate) {
    entriesQuery = entriesQuery.lte("entry_date", options.endDate);
  }

  const [accountsResult, entriesResult] = await Promise.all([
    entityFilter(
      db
        .from("chart_of_accounts")
        .select("id, account_code, name, account_type, normal_balance")
        .eq("organization_id", membership.organizationId)
        .eq("is_active", true)
        .order("account_code", { ascending: true }),
      membership.entityId,
    ),
    entriesQuery,
  ]);

  if (accountsResult.error) {
    throw new Error(accountsResult.error.message);
  }

  if (entriesResult.error) {
    throw new Error(entriesResult.error.message);
  }

  const accountMap = new Map<string, LedgerBalance>();
  ((accountsResult.data ?? []) as ReportAccount[]).forEach((account) => {
    accountMap.set(account.id, {
      accountId: account.id,
      accountCode: account.account_code,
      accountName: account.name,
      accountType: account.account_type,
      normalBalance: account.normal_balance,
      debit: 0,
      credit: 0,
      balance: 0,
    });
  });

  ((entriesResult.data ?? []) as ReportJournalEntry[]).forEach((entry) => {
    (entry.journal_lines ?? []).forEach((line) => {
      const row = accountMap.get(line.account_id ?? "");
      if (!row) {
        return;
      }

      row.debit += Number(line.debit_amount ?? 0);
      row.credit += Number(line.credit_amount ?? 0);
      row.balance = row.debit - row.credit;
    });
  });

  return Array.from(accountMap.values());
}

function toStatementLines(rows: LedgerBalance[]) {
  return rows
    .map(
      (row): StatementLine => ({
        accountCode: row.accountCode,
        accountName: row.accountName,
        amount: statementAmount(row),
      }),
    )
    .filter((row) => Math.abs(row.amount) > 0.0001);
}

export async function getReportCatalog() {
  return [
    {
      id: "profit-loss",
      title: "Profit & Loss",
      description: "Year-to-date operating performance from posted journal activity.",
      cadence: "Refreshes on every posting",
      status: "live",
    },
    {
      id: "balance-sheet",
      title: "Balance Sheet",
      description: "As-of financial position across assets, liabilities, and equity.",
      cadence: "Point-in-time snapshot",
      status: "live",
    },
    {
      id: "trial-balance",
      title: "Trial Balance",
      description: "Full ledger balancing report with debit and credit totals.",
      cadence: "Point-in-time snapshot",
      status: "live",
    },
    {
      id: "cash-flow",
      title: "Cash Flow",
      description: "Indirect-method operating, investing, and financing movement.",
      cadence: "Next reporting release",
      status: "queued",
    },
    {
      id: "aging",
      title: "AR / AP Aging",
      description: "Receivables and payables maturity analysis by counterparty.",
      cadence: "Next reporting release",
      status: "queued",
    },
    {
      id: "budget-variance",
      title: "Budget vs Actual",
      description: "Budget line performance against posted actuals by period.",
      cadence: "Next planning release",
      status: "queued",
    },
  ] satisfies ReportCatalogItem[];
}

export async function getReportingWorkspaceSummary(
  membership: MembershipContext,
): Promise<ReportingWorkspaceSummary> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;

  const [entitiesResult, accountsResult, periodsResult, journalsResult] = await Promise.all([
    db
      .from("entities")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", membership.organizationId),
    entityFilter(
      db
        .from("chart_of_accounts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", membership.organizationId)
        .eq("is_active", true),
      membership.entityId,
    ),
    entityFilter(
      db
        .from("fiscal_periods")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", membership.organizationId)
        .eq("status", "open"),
      membership.entityId,
    ),
    entityFilter(
      db
        .from("journal_entries")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", membership.organizationId)
        .eq("status", "posted"),
      membership.entityId,
    ),
  ]);

  const errors = [
    entitiesResult.error,
    accountsResult.error,
    periodsResult.error,
    journalsResult.error,
  ].filter(Boolean);
  if (errors.length) {
    throw new Error(errors[0]?.message ?? "Unable to load reporting workspace.");
  }

  return {
    entityScopeLabel: membership.entityId ? "Entity-scoped reporting" : "Organization-wide reporting",
    activeEntityCount: entitiesResult.count ?? 0,
    totalAccounts: accountsResult.count ?? 0,
    openPeriods: periodsResult.count ?? 0,
    postedJournalCount: journalsResult.count ?? 0,
  };
}

export async function getTrialBalanceSnapshot(
  membership: MembershipContext,
): Promise<TrialBalanceSnapshot> {
  const asOf = new Date().toISOString().slice(0, 10);
  const balances = await getLedgerBalances(membership, { endDate: asOf });

  const rows: TrialBalanceRow[] = balances
    .filter((row) => row.debit !== 0 || row.credit !== 0)
    .map((row) => ({
      accountCode: row.accountCode,
      accountName: row.accountName,
      accountType: row.accountType,
      debit: row.debit,
      credit: row.credit,
      balance: row.balance,
    }));

  const totals = rows.reduce(
    (acc, row) => {
      acc.debit += row.debit;
      acc.credit += row.credit;
      acc.balance += row.balance;
      return acc;
    },
    { debit: 0, credit: 0, balance: 0 },
  );

  return {
    asOf,
    rows,
    totals,
  };
}

export async function getProfitAndLossSnapshot(
  membership: MembershipContext,
): Promise<ProfitAndLossSnapshot> {
  const now = new Date();
  const startDate = `${now.getUTCFullYear()}-01-01`;
  const endDate = now.toISOString().slice(0, 10);
  const balances = await getLedgerBalances(membership, { startDate, endDate });

  const revenue = toStatementLines(balances.filter((row) => row.accountType === "revenue"));
  const expenses = toStatementLines(balances.filter((row) => row.accountType === "expense"));

  const totalRevenue = revenue.reduce((sum, row) => sum + row.amount, 0);
  const totalExpenses = expenses.reduce((sum, row) => sum + row.amount, 0);

  return {
    startDate,
    endDate,
    revenue,
    expenses,
    totals: {
      revenue: totalRevenue,
      expenses: totalExpenses,
      netIncome: totalRevenue - totalExpenses,
    },
  };
}

export async function getBalanceSheetSnapshot(
  membership: MembershipContext,
): Promise<BalanceSheetSnapshot> {
  const asOf = new Date().toISOString().slice(0, 10);
  const balances = await getLedgerBalances(membership, { endDate: asOf });

  const assets = toStatementLines(balances.filter((row) => row.accountType === "asset"));
  const liabilities = toStatementLines(balances.filter((row) => row.accountType === "liability"));
  const equity = toStatementLines(balances.filter((row) => row.accountType === "equity"));

  return {
    asOf,
    assets,
    liabilities,
    equity,
    totals: {
      assets: assets.reduce((sum, row) => sum + row.amount, 0),
      liabilities: liabilities.reduce((sum, row) => sum + row.amount, 0),
      equity: equity.reduce((sum, row) => sum + row.amount, 0),
    },
  };
}
