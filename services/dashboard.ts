import { formatCurrency } from "@/lib/utils";
import { createServerSupabaseClient } from "@/supabase/server";
import type { DashboardSnapshot } from "@/types/dashboard";
import type { MembershipContext } from "@/services/auth";

function getPeriodWindow() {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const priorMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const rollingStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

  return {
    monthStart: monthStart.toISOString().slice(0, 10),
    priorMonthStart: priorMonthStart.toISOString().slice(0, 10),
    rollingStart: rollingStart.toISOString().slice(0, 10),
    today: now.toISOString().slice(0, 10),
  };
}

function percentChange(current: number, previous: number) {
  if (previous === 0) {
    return current === 0 ? "No change" : "New activity this period";
  }

  const delta = ((current - previous) / Math.abs(previous)) * 100;
  const direction = delta >= 0 ? "+" : "";
  return `${direction}${delta.toFixed(1)}% vs prior month`;
}

type DashboardJournalLine = {
  account?: { account_type?: string; name?: string } | null;
  account_id?: string;
  credit_amount?: number | string | null;
  debit_amount?: number | string | null;
};

type DashboardJournalEntry = {
  entry_number?: string;
  source_type?: string;
  status?: string;
  journal_lines?: DashboardJournalLine[];
};

type DashboardBalanceRow = { amount?: number | string | null };
type DashboardOpenItemRow = { outstanding_amount?: number | string | null };
type DashboardBankAccount = { account_name: string; chart_account_id: string };
type DashboardInvoiceAgingRow = { outstanding_amount?: number | string | null; due_date?: string | null };

function entityFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  entityId: string | null,
) {
  return entityId ? query.eq("entity_id", entityId) : query;
}

function monthKeyFromDate(date: string) {
  return date.slice(0, 7);
}

function monthLabel(key: string) {
  const [year, month] = key.split("-");
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(new Date(Date.UTC(Number(year), Number(month) - 1, 1)));
}

function buildRollingMonths(startKey: string, count: number) {
  const [year, month] = startKey.split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 + index, 1));
    return date.toISOString().slice(0, 7);
  });
}

function ageBucket(dueDate: string | null | undefined, today: string) {
  if (!dueDate) return "Unscheduled";
  const due = new Date(dueDate);
  const current = new Date(today);
  const diffDays = Math.floor((current.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Current";
  if (diffDays <= 30) return "1-30";
  if (diffDays <= 60) return "31-60";
  return "61+";
}

function bucketForecastMonth(dueDate: string | null | undefined, fallbackKey: string, allowedKeys: Set<string>) {
  if (!dueDate) {
    return fallbackKey;
  }
  const key = monthKeyFromDate(dueDate);
  if (allowedKeys.has(key)) {
    return key;
  }
  if (key < fallbackKey) {
    return fallbackKey;
  }
  return null;
}

export async function getDashboardSnapshot(
  membership: MembershipContext,
): Promise<DashboardSnapshot> {
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;
  const { monthStart, priorMonthStart, rollingStart, today } = getPeriodWindow();

  const orgPromise = db
    .from("organizations")
    .select("name")
    .eq("id", membership.organizationId)
    .single();

  const entityPromise = membership.entityId
    ? db.from("entities").select("name").eq("id", membership.entityId).single()
    : Promise.resolve({ data: null, error: null });

  const currentRevenuePromise = entityFilter(
    db
      .from("journal_entries")
      .select(
        "entry_date, journal_lines(credit_amount, debit_amount, account:chart_of_accounts!journal_lines_account_id_fkey(account_type, name))",
      )
      .eq("organization_id", membership.organizationId)
      .eq("status", "posted")
      .gte("entry_date", monthStart),
    membership.entityId,
  );

  const previousRevenuePromise = entityFilter(
    db
      .from("journal_entries")
      .select(
        "entry_date, journal_lines(credit_amount, debit_amount, account:chart_of_accounts!journal_lines_account_id_fkey(account_type, name))",
      )
      .eq("organization_id", membership.organizationId)
      .eq("status", "posted")
      .gte("entry_date", priorMonthStart)
      .lt("entry_date", monthStart),
    membership.entityId,
  );

  const arPromise = entityFilter(
    db
      .from("invoices")
      .select("outstanding_amount")
      .eq("organization_id", membership.organizationId)
      .in("status", ["approved", "sent", "partially_paid"]),
    membership.entityId,
  );

  const apPromise = entityFilter(
    db
      .from("bills")
      .select("outstanding_amount")
      .eq("organization_id", membership.organizationId)
      .in("status", ["approved", "scheduled", "partially_paid"]),
    membership.entityId,
  );

  const invoiceAgingPromise = entityFilter(
    db
      .from("invoices")
      .select("outstanding_amount, due_date")
      .eq("organization_id", membership.organizationId)
      .in("status", ["approved", "sent", "partially_paid"]),
    membership.entityId,
  );

  const billAgingPromise = entityFilter(
    db
      .from("bills")
      .select("outstanding_amount, due_date")
      .eq("organization_id", membership.organizationId)
      .in("status", ["approved", "scheduled", "partially_paid"]),
    membership.entityId,
  );

  const budgetPromise = entityFilter(
    db
      .from("budget_lines")
      .select("amount")
      .eq("organization_id", membership.organizationId),
    membership.entityId,
  );

  const expensePromise = entityFilter(
    db
      .from("journal_entries")
      .select(
        "entry_date, journal_lines(debit_amount, credit_amount, account:chart_of_accounts!journal_lines_account_id_fkey(account_type, name))",
      )
      .eq("organization_id", membership.organizationId)
      .eq("status", "posted")
      .gte("entry_date", monthStart),
    membership.entityId,
  );

  const rollingLedgerPromise = entityFilter(
    db
      .from("journal_entries")
      .select(
        "entry_date, journal_lines(debit_amount, credit_amount, account:chart_of_accounts!journal_lines_account_id_fkey(account_type, name))",
      )
      .eq("organization_id", membership.organizationId)
      .eq("status", "posted")
      .gte("entry_date", rollingStart),
    membership.entityId,
  );

  const bankAccountsPromise = entityFilter(
    db
      .from("bank_accounts")
      .select("account_name, chart_account_id")
      .eq("organization_id", membership.organizationId),
    membership.entityId,
  );

  const recentJournalsPromise = entityFilter(
    db
      .from("journal_entries")
      .select("id, entry_number, source_type, status, created_at, journal_lines(credit_amount, debit_amount)")
      .eq("organization_id", membership.organizationId)
      .order("created_at", { ascending: false })
      .limit(5),
    membership.entityId,
  );

  const [orgResult, entityResult, currentRevenueResult, previousRevenueResult, arResult, apResult, invoiceAgingResult, billAgingResult, budgetResult, expenseResult, rollingLedgerResult, bankAccountsResult, recentJournalsResult] =
    await Promise.all([
      orgPromise,
      entityPromise,
      currentRevenuePromise,
      previousRevenuePromise,
      arPromise,
      apPromise,
      invoiceAgingPromise,
      billAgingPromise,
      budgetPromise,
      expensePromise,
      rollingLedgerPromise,
      bankAccountsPromise,
      recentJournalsPromise,
    ]);

  const errors = [
    orgResult.error,
    entityResult.error,
    currentRevenueResult.error,
    previousRevenueResult.error,
    arResult.error,
    apResult.error,
    invoiceAgingResult.error,
    billAgingResult.error,
    budgetResult.error,
    expenseResult.error,
    rollingLedgerResult.error,
    bankAccountsResult.error,
    recentJournalsResult.error,
  ].filter(Boolean);

  if (errors.length > 0) {
    throw new Error(errors[0]?.message ?? "Unable to load dashboard data.");
  }

  const currentRevenueLines = ((currentRevenueResult.data ?? []) as DashboardJournalEntry[]).flatMap(
    (entry: DashboardJournalEntry) =>
      (entry.journal_lines ?? []).filter(
        (line: DashboardJournalLine) => line.account?.account_type === "revenue",
      ),
  );
  const previousRevenueLines = ((previousRevenueResult.data ?? []) as DashboardJournalEntry[]).flatMap(
    (entry: DashboardJournalEntry) =>
      (entry.journal_lines ?? []).filter(
        (line: DashboardJournalLine) => line.account?.account_type === "revenue",
      ),
  );
  const expenseLines = ((expenseResult.data ?? []) as DashboardJournalEntry[]).flatMap(
    (entry: DashboardJournalEntry) =>
      (entry.journal_lines ?? []).filter(
        (line: DashboardJournalLine) => line.account?.account_type === "expense",
      ),
  );

  const currentRevenue = currentRevenueLines.reduce(
    (sum: number, line: DashboardJournalLine) => sum + Number(line.credit_amount ?? 0),
    0,
  );
  const previousRevenue = previousRevenueLines.reduce(
    (sum: number, line: DashboardJournalLine) => sum + Number(line.credit_amount ?? 0),
    0,
  );
  const arOutstanding = ((arResult.data ?? []) as DashboardOpenItemRow[]).reduce(
    (sum: number, invoice: DashboardOpenItemRow) => sum + Number(invoice.outstanding_amount ?? 0),
    0,
  );
  const apOutstanding = ((apResult.data ?? []) as DashboardOpenItemRow[]).reduce(
    (sum: number, bill: DashboardOpenItemRow) => sum + Number(bill.outstanding_amount ?? 0),
    0,
  );
  const budgetAmount = ((budgetResult.data ?? []) as DashboardBalanceRow[]).reduce(
    (sum: number, line: DashboardBalanceRow) => sum + Number(line.amount ?? 0),
    0,
  );
  const actualExpense = expenseLines.reduce(
    (sum: number, line: DashboardJournalLine) => sum + Number(line.debit_amount ?? 0),
    0,
  );
  const budgetVariance = budgetAmount - actualExpense;

  const revenueSeriesMap = new Map<string, number>();
  currentRevenueLines.forEach((line: DashboardJournalLine) => {
    const accountName = line.account?.name ?? "Revenue";
    revenueSeriesMap.set(accountName, (revenueSeriesMap.get(accountName) ?? 0) + Number(line.credit_amount ?? 0));
  });

  const rollingMonthKeys = buildRollingMonths(rollingStart.slice(0, 7), 6);
  const trendMap = new Map(
    rollingMonthKeys.map((key) => [key, { period: monthLabel(key), revenue: 0, expenses: 0, netIncome: 0 }]),
  );

  ((rollingLedgerResult.data ?? []) as (DashboardJournalEntry & { entry_date?: string })[]).forEach((entry) => {
    const key = entry.entry_date ? monthKeyFromDate(entry.entry_date) : null;
    if (!key || !trendMap.has(key)) {
      return;
    }

    const bucket = trendMap.get(key)!;
    (entry.journal_lines ?? []).forEach((line: DashboardJournalLine) => {
      if (line.account?.account_type === "revenue") {
        bucket.revenue += Number(line.credit_amount ?? 0);
      }
      if (line.account?.account_type === "expense") {
        bucket.expenses += Number(line.debit_amount ?? 0);
      }
    });
    bucket.netIncome = bucket.revenue - bucket.expenses;
  });

  const receivablesAgingMap = new Map<string, number>([
    ["Current", 0],
    ["1-30", 0],
    ["31-60", 0],
    ["61+", 0],
  ]);
  ((invoiceAgingResult.data ?? []) as DashboardInvoiceAgingRow[]).forEach((row) => {
    const bucket = ageBucket(row.due_date, today);
    receivablesAgingMap.set(bucket, (receivablesAgingMap.get(bucket) ?? 0) + Number(row.outstanding_amount ?? 0));
  });

  const payablesAgingMap = new Map<string, number>([
    ["Current", 0],
    ["1-30", 0],
    ["31-60", 0],
    ["61+", 0],
  ]);
  ((billAgingResult.data ?? []) as DashboardInvoiceAgingRow[]).forEach((row) => {
    const bucket = ageBucket(row.due_date, today);
    payablesAgingMap.set(bucket, (payablesAgingMap.get(bucket) ?? 0) + Number(row.outstanding_amount ?? 0));
  });

  const bankAccounts = (bankAccountsResult.data ?? []) as DashboardBankAccount[];
  const bankAccountIds = bankAccounts.map((account) => account.chart_account_id).filter(Boolean);
  const cashEntries =
    bankAccountIds.length > 0
      ? await entityFilter(
          db
            .from("journal_entries")
            .select("entry_date, journal_lines(account_id, debit_amount, credit_amount)")
            .eq("organization_id", membership.organizationId)
            .eq("status", "posted")
            .lte("entry_date", today),
          membership.entityId,
        )
      : { data: [], error: null };

  if (cashEntries.error) {
    throw new Error(cashEntries.error.message);
  }

  const cashLines = ((cashEntries.data ?? []) as DashboardJournalEntry[]).flatMap(
    (entry: DashboardJournalEntry) =>
      (entry.journal_lines ?? []).filter((line: DashboardJournalLine) =>
        bankAccountIds.includes(line.account_id ?? ""),
      ),
  );

  const cashSeries = bankAccounts.map((account: DashboardBankAccount) => {
    const balance = cashLines
      .filter((line: DashboardJournalLine) => line.account_id === account.chart_account_id)
      .reduce(
        (sum: number, line: DashboardJournalLine) =>
          sum + Number(line.debit_amount ?? 0) - Number(line.credit_amount ?? 0),
        0,
      );

    return {
      label: account.account_name,
      value: balance,
    };
  });

  const currentCashBalance = cashSeries.reduce((sum, item) => sum + item.value, 0);
  const forecastKeys = buildRollingMonths(today.slice(0, 7), 6);
  const forecastKeySet = new Set(forecastKeys);
  const inflowMap = new Map(forecastKeys.map((key) => [key, 0]));
  const outflowMap = new Map(forecastKeys.map((key) => [key, 0]));

  ((invoiceAgingResult.data ?? []) as DashboardInvoiceAgingRow[]).forEach((row) => {
    const bucket = bucketForecastMonth(row.due_date, forecastKeys[0], forecastKeySet);
    if (!bucket) return;
    inflowMap.set(bucket, (inflowMap.get(bucket) ?? 0) + Number(row.outstanding_amount ?? 0));
  });

  ((billAgingResult.data ?? []) as DashboardInvoiceAgingRow[]).forEach((row) => {
    const bucket = bucketForecastMonth(row.due_date, forecastKeys[0], forecastKeySet);
    if (!bucket) return;
    outflowMap.set(bucket, (outflowMap.get(bucket) ?? 0) + Number(row.outstanding_amount ?? 0));
  });

  let runningCash = currentCashBalance;
  const cashForecast = forecastKeys.map((key) => {
    const inflows = inflowMap.get(key) ?? 0;
    const outflows = outflowMap.get(key) ?? 0;
    runningCash += inflows - outflows;
    return {
      period: monthLabel(key),
      inflows,
      outflows,
      endingCash: runningCash,
    };
  });

  const recentTransactions = ((recentJournalsResult.data ?? []) as DashboardJournalEntry[]).map(
    (journal: DashboardJournalEntry) => {
    const total = (journal.journal_lines ?? []).reduce(
      (sum: number, line: DashboardJournalLine) => sum + Number(line.debit_amount ?? 0),
      0,
    );

    return {
      reference: journal.entry_number ?? "Unnumbered",
      type: journal.source_type ?? "manual",
      amount: formatCurrency(total),
      status: journal.status === "posted" ? "Posted" : "Draft",
    };
    },
  );

  return {
    organizationName: orgResult.data?.name ?? "Organization",
    entityName: entityResult.data?.name ?? null,
    kpis: [
      {
        label: "Monthly Revenue",
        value: formatCurrency(currentRevenue),
        change: percentChange(currentRevenue, previousRevenue),
      },
      {
        label: "A/R Outstanding",
        value: formatCurrency(arOutstanding),
        change: `${arResult.data?.length ?? 0} open invoices`,
      },
      {
        label: "A/P Outstanding",
        value: formatCurrency(apOutstanding),
        change: `${apResult.data?.length ?? 0} open bills`,
      },
      {
        label: "Budget Variance",
        value: formatCurrency(budgetVariance),
        change: budgetVariance >= 0 ? "Favorable against budget" : "Unfavorable against budget",
      },
    ],
    revenueSeries: Array.from(revenueSeriesMap.entries()).map(([label, value]) => ({ label, value })),
    cashSeries,
    cashForecast,
    trendSeries: Array.from(trendMap.values()),
    receivablesAging: Array.from(receivablesAgingMap.entries()).map(([label, value]) => ({ label, value })),
    payablesAging: Array.from(payablesAgingMap.entries()).map(([label, value]) => ({ label, value })),
    recentTransactions,
  };
}
