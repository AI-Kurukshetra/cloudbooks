export type TrialBalanceRow = {
  accountCode: string;
  accountName: string;
  accountType: string;
  debit: number;
  credit: number;
  balance: number;
};

export type TrialBalanceSnapshot = {
  asOf: string;
  rows: TrialBalanceRow[];
  totals: {
    debit: number;
    credit: number;
    balance: number;
  };
};

export type StatementLine = {
  accountCode: string;
  accountName: string;
  amount: number;
};

export type ProfitAndLossSnapshot = {
  startDate: string;
  endDate: string;
  revenue: StatementLine[];
  expenses: StatementLine[];
  totals: {
    revenue: number;
    expenses: number;
    netIncome: number;
  };
};

export type BalanceSheetSnapshot = {
  asOf: string;
  assets: StatementLine[];
  liabilities: StatementLine[];
  equity: StatementLine[];
  totals: {
    assets: number;
    liabilities: number;
    equity: number;
  };
};

export type ReportingWorkspaceSummary = {
  entityScopeLabel: string;
  activeEntityCount: number;
  totalAccounts: number;
  openPeriods: number;
  postedJournalCount: number;
};
