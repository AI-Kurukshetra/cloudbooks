"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  createAssetAction,
  deleteAssetAction,
  updateAssetAction,
} from "@/app/(dashboard)/assets/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import type { AssetsWorkbench } from "@/services/operations";
import { createAssetSchema, type CreateAssetInput, type UpdateAssetInput } from "@/validators/operations";

function fieldError(message?: string) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

function emptyAsset(data: AssetsWorkbench): CreateAssetInput {
  return {
    organizationId: data.organizationId,
    entityId: data.entityId,
    assetCode: "",
    name: "",
    category: "",
    acquisitionDate: new Date().toISOString().slice(0, 10),
    inServiceDate: new Date().toISOString().slice(0, 10),
    cost: 0,
    salvageValue: 0,
    usefulLifeMonths: 36,
    depreciationMethod: "straight_line",
    assetAccountId: data.accounts[0]?.id ?? "",
    accumulatedDepreciationAccountId: data.accounts[0]?.id ?? "",
    depreciationExpenseAccountId: data.expenseAccounts[0]?.id ?? "",
  };
}

export function AssetRegistryManager({ data }: { data: AssetsWorkbench }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const defaults = useMemo(() => emptyAsset(data), [data]);
  const form = useForm<CreateAssetInput>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: defaults,
  });

  const assetLookup = useMemo(() => {
    return new Map(data.assetRecords.map((asset) => [asset.id, asset]));
  }, [data.assetRecords]);

  function loadAsset(assetId: string) {
    const asset = assetLookup.get(assetId);
    if (!asset) {
      return;
    }

    setEditingId(asset.id);
    setSubmitError(null);
    setSubmitMessage(null);
    form.reset({
      organizationId: data.organizationId,
      entityId: data.entityId,
      assetCode: asset.assetCode,
      name: asset.name,
      category: asset.category,
      acquisitionDate: asset.acquisitionDate,
      inServiceDate: asset.inServiceDate,
      cost: asset.cost,
      salvageValue: asset.salvageValue,
      usefulLifeMonths: asset.usefulLifeMonths,
      depreciationMethod: asset.depreciationMethod,
      assetAccountId: asset.assetAccountId,
      accumulatedDepreciationAccountId: asset.accumulatedDepreciationAccountId,
      depreciationExpenseAccountId: asset.depreciationExpenseAccountId,
    });
  }

  function resetForm() {
    setEditingId(null);
    form.reset(emptyAsset(data));
  }

  function submit(values: CreateAssetInput) {
    setIsPending(true);
    setSubmitError(null);
    setSubmitMessage(null);

    startTransition(async () => {
      try {
        if (editingId) {
          await updateAssetAction({
            assetId: editingId,
            ...values,
          } satisfies UpdateAssetInput);
          resetForm();
          setSubmitMessage("Asset updated.");
        } else {
          await createAssetAction(values);
          resetForm();
          setSubmitMessage("Asset created.");
        }
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Unable to save asset.");
      } finally {
        setIsPending(false);
      }
    });
  }

  function removeAsset(assetId: string) {
    setIsPending(true);
    setSubmitError(null);
    setSubmitMessage(null);

    startTransition(async () => {
      try {
        await deleteAssetAction({
          assetId,
          organizationId: data.organizationId,
        });
        if (editingId === assetId) {
          resetForm();
        }
        setSubmitMessage("Asset deleted.");
      } catch (error) {
        setSubmitError(error instanceof Error ? error.message : "Unable to delete asset.");
      } finally {
        setIsPending(false);
      }
    });
  }

  const errors = form.formState.errors;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Asset editor</p>
            <h3 className="mt-2 text-xl font-semibold">
              {editingId ? "Update asset register item" : "Create asset register item"}
            </h3>
          </div>
          {editingId ? (
            <Button onClick={resetForm} type="button" variant="secondary">
              New asset
            </Button>
          ) : null}
        </div>
        <form className="mt-6 space-y-5" onSubmit={form.handleSubmit(submit)}>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset code</label>
              <Input {...form.register("assetCode")} />
              {fieldError(errors.assetCode?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset name</label>
              <Input {...form.register("name")} />
              {fieldError(errors.name?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Input {...form.register("category")} />
              {fieldError(errors.category?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Acquisition date</label>
              <Input type="date" {...form.register("acquisitionDate")} />
              {fieldError(errors.acquisitionDate?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">In service date</label>
              <Input type="date" {...form.register("inServiceDate")} />
              {fieldError(errors.inServiceDate?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Depreciation method</label>
              <Input {...form.register("depreciationMethod")} />
              {fieldError(errors.depreciationMethod?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cost</label>
              <Input type="number" step="0.01" {...form.register("cost", { valueAsNumber: true })} />
              {fieldError(errors.cost?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Salvage value</label>
              <Input type="number" step="0.01" {...form.register("salvageValue", { valueAsNumber: true })} />
              {fieldError(errors.salvageValue?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Useful life (months)</label>
              <Input type="number" {...form.register("usefulLifeMonths", { valueAsNumber: true })} />
              {fieldError(errors.usefulLifeMonths?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset account</label>
              <Select {...form.register("assetAccountId")}>
                {data.accounts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
              {fieldError(errors.assetAccountId?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Accumulated depreciation account</label>
              <Select {...form.register("accumulatedDepreciationAccountId")}>
                {data.accounts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
              {fieldError(errors.accumulatedDepreciationAccountId?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Depreciation expense account</label>
              <Select {...form.register("depreciationExpenseAccountId")}>
                {data.expenseAccounts.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </Select>
              {fieldError(errors.depreciationExpenseAccountId?.message)}
            </div>
          </div>
          {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
          {submitMessage ? <p className="text-sm text-emerald-700">{submitMessage}</p> : null}
          <div className="flex flex-wrap gap-3">
            <Button disabled={isPending} type="submit">
              {isPending ? "Saving..." : editingId ? "Save asset" : "Create asset"}
            </Button>
            {editingId ? (
              <Button disabled={isPending} onClick={resetForm} type="button" variant="ghost">
                Cancel edit
              </Button>
            ) : null}
          </div>
        </form>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Asset register</p>
        <h3 className="mt-2 text-xl font-semibold">Existing assets</h3>
        <div className="mt-5 space-y-3">
          {data.assetRecords.length ? null : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-muted-foreground">
              No assets created yet.
            </div>
          )}
          {data.assetRecords.map((asset) => (
            <div key={asset.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-foreground">{asset.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {asset.assetCode} · {asset.category} · {formatCurrency(asset.cost)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => loadAsset(asset.id)} type="button" variant="secondary">
                    Edit
                  </Button>
                  <Button onClick={() => removeAsset(asset.id)} type="button" variant="ghost">
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
