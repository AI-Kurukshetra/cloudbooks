import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function RecordsTableCard({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: { id: string; primary: string; secondary: string; tertiary: string; status: string }[];
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
              <TableHead>Primary</TableHead>
              <TableHead>Code / Type</TableHead>
              <TableHead>Detail</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell className="py-10 text-sm text-muted-foreground" colSpan={4}>
                  No records available yet.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.primary}</TableCell>
                  <TableCell className="capitalize">{row.secondary}</TableCell>
                  <TableCell>{row.tertiary}</TableCell>
                  <TableCell>
                    <Badge variant={row.status === "active" ? "success" : "outline"}>{row.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
