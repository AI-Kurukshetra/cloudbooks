"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { ZodError } from "zod";

import { createVatReturnAction } from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SettingsWorkbench } from "@/services/operations";
import { createVatReturnSchema, type CreateVatReturnInput } from "@/validators/operations";

export function VatReturnForm({ data }: { data: SettingsWorkbench }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const form = useForm<CreateVatReturnInput>({
    resolver: zodResolver(createVatReturnSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      periodStart: new Date(new Date().getUTCFullYear(), 0, 1).toISOString().slice(0, 10),
      periodEnd: new Date().toISOString().slice(0, 10),
      filingDueOn: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
      currencyCode: data.currencyCode,
      notes: "",
    },
  });

  return (
    <Card className="border-white/60 bg-white/78">
      <CardHeader>
        <CardTitle className="text-2xl">VAT return preparation</CardTitle>
        <CardDescription>Prepare VAT totals from approved invoices and bills for the selected filing window.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((values) => {
            setIsPending(true);
            setError(null);
            setMessage(null);

            startTransition(async () => {
              try {
                await createVatReturnAction({
                  ...values,
                  notes: values.notes || undefined,
                });
                setMessage("VAT return prepared.");
              } catch (submitError) {
                if (submitError instanceof ZodError) {
                  setError(submitError.issues.map((issue) => issue.message).join(" "));
                } else {
                  setError(submitError instanceof Error ? submitError.message : "Unable to prepare VAT return.");
                }
              } finally {
                setIsPending(false);
              }
            });
          })}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input type="date" {...form.register("periodStart")} />
            <Input type="date" {...form.register("periodEnd")} />
            <Input type="date" {...form.register("filingDueOn")} />
            <Input {...form.register("currencyCode")} />
          </div>
          <Textarea placeholder="Internal filing notes" {...form.register("notes")} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <Button disabled={isPending} type="submit">
            {isPending ? "Preparing..." : "Prepare VAT return"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
