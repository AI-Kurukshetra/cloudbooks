"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { ZodError } from "zod";

import {
  createInventoryItemAction,
  createInventoryMovementAction,
} from "@/app/(dashboard)/assets/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AssetsWorkbench } from "@/services/operations";
import {
  createInventoryItemSchema,
  createInventoryMovementSchema,
  type CreateInventoryItemInput,
  type CreateInventoryMovementInput,
} from "@/validators/operations";

export function InventoryManager({ data }: { data: AssetsWorkbench }) {
  const [itemMessage, setItemMessage] = useState<string | null>(null);
  const [itemError, setItemError] = useState<string | null>(null);
  const [movementMessage, setMovementMessage] = useState<string | null>(null);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const itemForm = useForm<CreateInventoryItemInput>({
    resolver: zodResolver(createInventoryItemSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      sku: "",
      name: "",
      itemType: "inventory",
      assetAccountId: data.accounts[0]?.id,
      cogsAccountId: data.expenseAccounts[0]?.id,
      revenueAccountId: data.accounts[0]?.id,
      unitOfMeasure: "ea",
    },
  });

  const movementForm = useForm<CreateInventoryMovementInput>({
    resolver: zodResolver(createInventoryMovementSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      inventoryItemId: data.inventoryRecords[0]?.id ?? "",
      movementDate: new Date().toISOString().slice(0, 10),
      movementType: "receipt",
      quantity: 1,
      unitCost: 0,
    },
  });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
      <Card className="border-white/60 bg-white/78">
        <CardHeader>
          <CardTitle className="text-2xl">Inventory items</CardTitle>
          <CardDescription>Create stock items with linked accounting dimensions for future inventory accounting flows.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={itemForm.handleSubmit((values) => {
              setIsPending(true);
              setItemMessage(null);
              setItemError(null);

              startTransition(async () => {
                try {
                  await createInventoryItemAction({
                    ...values,
                    assetAccountId: values.assetAccountId || undefined,
                    cogsAccountId: values.cogsAccountId || undefined,
                    revenueAccountId: values.revenueAccountId || undefined,
                  });
                  itemForm.reset({
                    ...itemForm.getValues(),
                    sku: "",
                    name: "",
                  });
                  setItemMessage("Inventory item created.");
                } catch (submitError) {
                  if (submitError instanceof ZodError) {
                    setItemError(submitError.issues.map((issue) => issue.message).join(" "));
                  } else {
                    setItemError(submitError instanceof Error ? submitError.message : "Unable to create inventory item.");
                  }
                } finally {
                  setIsPending(false);
                }
              });
            })}
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <Input placeholder="SKU" {...itemForm.register("sku")} />
              <Input placeholder="Item name" {...itemForm.register("name")} />
              <Select {...itemForm.register("itemType")}>
                <option value="inventory">Inventory</option>
                <option value="service">Service</option>
                <option value="non_inventory">Non-inventory</option>
              </Select>
              <Select {...itemForm.register("assetAccountId")}>
                <option value="">No asset account</option>
                {data.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.label}
                  </option>
                ))}
              </Select>
              <Select {...itemForm.register("cogsAccountId")}>
                <option value="">No COGS account</option>
                {data.expenseAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.label}
                  </option>
                ))}
              </Select>
              <Input placeholder="Unit of measure" {...itemForm.register("unitOfMeasure")} />
            </div>
            {itemError ? <p className="text-sm text-destructive">{itemError}</p> : null}
            {itemMessage ? <p className="text-sm text-emerald-700">{itemMessage}</p> : null}
            <Button disabled={isPending} type="submit">
              {isPending ? "Saving..." : "Create inventory item"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card className="border-white/60 bg-white/78">
        <CardHeader>
          <CardTitle className="text-2xl">Stock movements</CardTitle>
          <CardDescription>Record receipts, issues, and adjustments to maintain quantity on hand.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={movementForm.handleSubmit((values) => {
              setIsPending(true);
              setMovementMessage(null);
              setMovementError(null);

              startTransition(async () => {
                try {
                  await createInventoryMovementAction({
                    ...values,
                    unitCost: values.unitCost || undefined,
                  });
                  movementForm.reset({
                    ...movementForm.getValues(),
                    quantity: 1,
                    unitCost: 0,
                  });
                  setMovementMessage("Inventory movement recorded.");
                } catch (submitError) {
                  if (submitError instanceof ZodError) {
                    setMovementError(submitError.issues.map((issue) => issue.message).join(" "));
                  } else {
                    setMovementError(submitError instanceof Error ? submitError.message : "Unable to record inventory movement.");
                  }
                } finally {
                  setIsPending(false);
                }
              });
            })}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <Select {...movementForm.register("inventoryItemId")}>
                {data.inventoryRecords.map((record) => (
                  <option key={record.id} value={record.id}>
                    {record.secondary} · {record.primary}
                  </option>
                ))}
              </Select>
              <Select {...movementForm.register("movementType")}>
                <option value="receipt">Receipt</option>
                <option value="issue">Issue</option>
                <option value="adjustment">Adjustment</option>
              </Select>
              <Input type="date" {...movementForm.register("movementDate")} />
              <Input type="number" step="0.01" placeholder="Quantity" {...movementForm.register("quantity", { valueAsNumber: true })} />
              <Input type="number" step="0.01" placeholder="Unit cost" {...movementForm.register("unitCost", { valueAsNumber: true })} />
            </div>
            {movementError ? <p className="text-sm text-destructive">{movementError}</p> : null}
            {movementMessage ? <p className="text-sm text-emerald-700">{movementMessage}</p> : null}
            <Button disabled={isPending || data.inventoryRecords.length === 0} type="submit">
              {isPending ? "Saving..." : "Record movement"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
