"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { ZodError } from "zod";

import { createBankCategorizationRuleAction } from "@/app/(dashboard)/banking/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { BankingWorkbench } from "@/services/operations";
import {
  createBankCategorizationRuleSchema,
  type CreateBankCategorizationRuleInput,
} from "@/validators/operations";

export function BankRuleForm({ data }: { data: BankingWorkbench }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const form = useForm<CreateBankCategorizationRuleInput>({
    resolver: zodResolver(createBankCategorizationRuleSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      bankAccountId: data.bankAccounts[0]?.id,
      ruleName: "",
      matchField: "description",
      matchOperator: "contains",
      matchValue: "",
      direction: undefined,
      suggestedAccountId: data.categorizationAccounts[0]?.id,
      priority: 100,
      status: "active",
    },
  });

  return (
    <Card className="border-white/60 bg-white/78">
      <CardHeader>
        <CardTitle className="text-2xl">Categorization rules</CardTitle>
        <CardDescription>Auto-tag imported bank feed rows using description and counterparty match rules.</CardDescription>
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
                await createBankCategorizationRuleAction({
                  ...values,
                  bankAccountId: values.bankAccountId || undefined,
                  direction: values.direction || undefined,
                  suggestedAccountId: values.suggestedAccountId || undefined,
                });
                form.reset({
                  ...form.getValues(),
                  ruleName: "",
                  matchValue: "",
                  priority: 100,
                });
                setMessage("Rule created.");
              } catch (submitError) {
                if (submitError instanceof ZodError) {
                  setError(submitError.issues.map((issue) => issue.message).join(" "));
                } else {
                  setError(submitError instanceof Error ? submitError.message : "Unable to create rule.");
                }
              } finally {
                setIsPending(false);
              }
            });
          })}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input placeholder="Rule name" {...form.register("ruleName")} />
            <Select {...form.register("bankAccountId")}>
              <option value="">All bank accounts</option>
              {data.bankAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label}
                </option>
              ))}
            </Select>
            <Select {...form.register("matchField")}>
              <option value="description">Description</option>
              <option value="counterparty_name">Counterparty</option>
            </Select>
            <Select {...form.register("matchOperator")}>
              <option value="contains">Contains</option>
              <option value="starts_with">Starts with</option>
              <option value="equals">Equals</option>
            </Select>
            <Input placeholder="Match value" {...form.register("matchValue")} />
            <Select {...form.register("direction")}>
              <option value="">Any direction</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </Select>
            <Select {...form.register("suggestedAccountId")}>
              <option value="">No suggestion</option>
              {data.categorizationAccounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label}
                </option>
              ))}
            </Select>
            <Input type="number" {...form.register("priority", { valueAsNumber: true })} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving..." : "Create rule"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
