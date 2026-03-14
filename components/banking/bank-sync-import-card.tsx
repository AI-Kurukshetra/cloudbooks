"use client";

import { useRouter } from "next/navigation";
import { type ChangeEvent, startTransition, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type BankAccountLookup = {
  id: string;
  label: string;
  detail?: string;
};

const samplePayload = JSON.stringify(
  [
    {
      transactionDate: "2026-03-12",
      postedDate: "2026-03-13",
      description: "Client settlement - Apex Capital",
      amount: 12450,
      direction: "credit",
      status: "unmatched",
      externalId: "feed-20260312-0001",
    },
    {
      transactionDate: "2026-03-12",
      postedDate: "2026-03-13",
      description: "Operating disbursement - telecom",
      amount: 328.42,
      direction: "debit",
      status: "review",
      externalId: "feed-20260312-0002",
    },
  ],
  null,
  2,
);

export function BankSyncImportCard({ bankAccounts }: { bankAccounts: BankAccountLookup[] }) {
  const router = useRouter();
  const hasBankAccounts = bankAccounts.length > 0;
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? "");
  const [payloadText, setPayloadText] = useState(samplePayload);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const parsedCount = useMemo(() => {
    try {
      const parsed = JSON.parse(payloadText);
      return Array.isArray(parsed)
        ? parsed.length
        : Array.isArray(parsed.transactions)
          ? parsed.transactions.length
          : 0;
    } catch {
      return 0;
    }
  }, [payloadText]);

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    setPayloadText(text);
    setMessage(`Loaded ${file.name}`);
    setError(null);
  }

  async function handleImport() {
    setIsPending(true);
    setError(null);
    setMessage(null);

    try {
      const parsed = JSON.parse(payloadText);
      const transactions = Array.isArray(parsed) ? parsed : parsed.transactions;

      const response = await fetch("/api/banking/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankAccountId,
          transactions,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message ?? "Unable to import transactions.");
      }

      setMessage(
        result.skippedCount > 0
          ? `${result.message} Skipped ${result.skippedCount} duplicate transaction${result.skippedCount === 1 ? "" : "s"}.`
          : result.message,
      );
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to import transactions.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="border-white/60 bg-white/78">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">Bank Feed Import</CardTitle>
            <CardDescription>
              Paste a JSON array or upload a `.json` export to load transactions into the active bank account.
            </CardDescription>
          </div>
          <Badge variant="secondary">{parsedCount} rows detected</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasBankAccounts ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Create a bank account first, then import external feed activity into it.
          </p>
        ) : null}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
          <Select value={bankAccountId} onChange={(event) => setBankAccountId(event.target.value)}>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </Select>
          <Input type="file" accept="application/json,.json" onChange={handleFileUpload} />
        </div>
        <Textarea
          className="min-h-[280px] font-mono text-xs"
          value={payloadText}
          onChange={(event) => setPayloadText(event.target.value)}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        <div className="flex flex-wrap items-center gap-3">
          <Button disabled={isPending || !bankAccountId || parsedCount === 0 || !hasBankAccounts} onClick={handleImport} type="button">
            {isPending ? "Importing..." : "Import transactions"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setPayloadText(samplePayload)}>
            Reload sample payload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
