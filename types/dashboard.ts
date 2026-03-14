export type DashboardSnapshot = {
  organizationName: string;
  entityName: string | null;
  kpis: { label: string; value: string; change: string }[];
  revenueSeries: { label: string; value: number }[];
  cashSeries: { label: string; value: number }[];
  cashForecast: {
    period: string;
    inflows: number;
    outflows: number;
    endingCash: number;
  }[];
  trendSeries: { period: string; revenue: number; expenses: number; netIncome: number }[];
  receivablesAging: { label: string; value: number }[];
  payablesAging: { label: string; value: number }[];
  recentTransactions: { reference: string; type: string; amount: string; status: string }[];
};
