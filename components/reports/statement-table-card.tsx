import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { StatementLine } from "@/types/reports";

export function StatementTableCard({
  title,
  description,
  lines,
  totalLabel,
  totalAmount,
}: {
  title: string;
  description: string;
  lines: StatementLine[];
  totalLabel: string;
  totalAmount: number;
}) {
  return (
    <Card className="border-slate-200 bg-white/95">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Account</TableHead>
              <TableHead>Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => (
              <TableRow key={`${line.accountCode}-${line.accountName}`}>
                <TableCell>{line.accountCode}</TableCell>
                <TableCell>{line.accountName}</TableCell>
                <TableCell>{formatCurrency(line.amount)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-semibold">{totalLabel}</TableCell>
              <TableCell />
              <TableCell className="font-semibold">{formatCurrency(totalAmount)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
