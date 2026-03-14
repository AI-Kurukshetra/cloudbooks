import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { TrialBalanceSnapshot } from "@/types/reports";

export function TrialBalanceCard({ snapshot }: { snapshot: TrialBalanceSnapshot }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trial Balance</CardTitle>
        <CardDescription>Posted ledger balances as of {snapshot.asOf}.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Debit</TableHead>
              <TableHead>Credit</TableHead>
              <TableHead>Net</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {snapshot.rows.map((row) => (
              <TableRow key={row.accountCode}>
                <TableCell>{row.accountCode}</TableCell>
                <TableCell>{row.accountName}</TableCell>
                <TableCell className="capitalize">{row.accountType}</TableCell>
                <TableCell>{formatCurrency(row.debit)}</TableCell>
                <TableCell>{formatCurrency(row.credit)}</TableCell>
                <TableCell>{formatCurrency(row.balance)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell />
              <TableCell />
              <TableCell className="font-semibold">{formatCurrency(snapshot.totals.debit)}</TableCell>
              <TableCell className="font-semibold">{formatCurrency(snapshot.totals.credit)}</TableCell>
              <TableCell className="font-semibold">{formatCurrency(snapshot.totals.balance)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
