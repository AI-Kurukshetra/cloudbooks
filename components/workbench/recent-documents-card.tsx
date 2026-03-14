import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { RecentDocument } from "@/types/workbench";

export function RecentDocumentsCard({
  title,
  description,
  documents,
}: {
  title: string;
  description: string;
  documents: RecentDocument[];
}) {
  return (
    <Card className="border-white/60 bg-white/78">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Number</TableHead>
              <TableHead>Counterparty</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document) => (
              <TableRow key={document.id}>
                <TableCell>{document.number}</TableCell>
                <TableCell>{document.party}</TableCell>
                <TableCell>{formatDate(document.date)}</TableCell>
                <TableCell>{formatCurrency(document.amount)}</TableCell>
                <TableCell>
                  <Badge variant={document.status === "approved" || document.status === "paid" ? "success" : "outline"}>
                    {document.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
