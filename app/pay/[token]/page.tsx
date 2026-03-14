import { notFound } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { getReminderByPayToken } from "@/services/invoices";
import { createServerSupabaseClient } from "@/supabase/server";

export default async function PayLinkPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createServerSupabaseClient();
  const reminder = await getReminderByPayToken(supabase, token);

  if (!reminder) {
    notFound();
  }

  const invoice = reminder.invoice;

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-12">
      <Card className="w-full border-white/60 bg-white/88">
        <CardHeader>
          <CardTitle className="text-3xl">Payment request</CardTitle>
          <CardDescription>Use this secure reference to arrange settlement with the finance team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4 rounded-3xl bg-slate-50 p-5 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground">Invoice</p>
              <p className="font-semibold">{invoice.invoice_number}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Customer</p>
              <p className="font-semibold">{invoice.customer?.display_name ?? "Customer"}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Due date</p>
              <p className="font-semibold">{formatDate(invoice.due_date)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Outstanding</p>
              <p className="font-semibold">{formatCurrency(invoice.outstanding_amount, invoice.currency_code)}</p>
            </div>
          </div>
          <p className="text-muted-foreground">
            This link confirms the invoice reference and amount due. Payment processor handoff is not connected in this deployment, so remittance should be coordinated through your finance operations channel.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
