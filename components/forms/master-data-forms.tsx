"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError } from "zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";

import { createAccountAction } from "@/app/(dashboard)/accounts/actions";
import { createCustomerAction } from "@/app/(dashboard)/customers/actions";
import { createEntityAction } from "@/app/(dashboard)/entities/actions";
import { createProjectAction } from "@/app/(dashboard)/projects/actions";
import { createVendorAction } from "@/app/(dashboard)/vendors/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type {
  AccountsWorkbench,
  CustomersWorkbench,
  EntitiesWorkbench,
  ProjectsWorkbench,
  VendorsWorkbench,
} from "@/services/master-data";
import {
  createAccountSchema,
  createCustomerSchema,
  createEntitySchema,
  createProjectSchema,
  createVendorSchema,
  type CreateAccountInput,
  type CreateCustomerInput,
  type CreateEntityInput,
  type CreateProjectInput,
  type CreateVendorInput,
} from "@/validators/master-data";

function useSubmitState() {
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(task: () => Promise<T>, successMessage: string) {
    setIsPending(true);
    setMessage(null);
    setError(null);
    try {
      await task();
      setMessage(successMessage);
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.issues.map((issue) => issue.message).join(" "));
      } else {
        setError(err instanceof Error ? err.message : "Unable to save record.");
      }
    } finally {
      setIsPending(false);
    }
  }

  return { isPending, message, error, run };
}

export function EntityForm({ data }: { data: EntitiesWorkbench }) {
  const form = useForm<CreateEntityInput>({
    resolver: zodResolver(createEntitySchema),
    defaultValues: {
      organizationId: data.organizationId,
      reportingCurrencyCode: data.reportingCurrencyCode,
      name: "",
      legalName: "",
      code: "",
      jurisdiction: "",
    },
  });
  const submit = useSubmitState();

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          submit.run(async () => {
            await createEntityAction(values);
            form.reset({ ...values, name: "", legalName: "", code: "", jurisdiction: "" });
          }, "Entity created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Entity name" {...form.register("name")} />
        <Input placeholder="Code" {...form.register("code")} />
        <Input placeholder="Legal name" {...form.register("legalName")} />
        <Input placeholder="Jurisdiction" {...form.register("jurisdiction")} />
      </div>
      <Input placeholder="Currency" {...form.register("reportingCurrencyCode")} />
      {submit.error ? <p className="text-sm text-destructive">{submit.error}</p> : null}
      {submit.message ? <p className="text-sm text-emerald-700">{submit.message}</p> : null}
      <Button disabled={submit.isPending} type="submit">
        {submit.isPending ? "Creating..." : "Create entity"}
      </Button>
    </form>
  );
}

export function AccountForm({ data }: { data: AccountsWorkbench }) {
  const form = useForm<CreateAccountInput>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      accountCode: "",
      name: "",
      description: "",
      accountType: "expense",
      normalBalance: "debit",
      currencyCode: data.currencyCode,
    },
  });
  const submit = useSubmitState();

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          submit.run(async () => {
            await createAccountAction(values);
            form.reset({ ...values, accountCode: "", name: "", description: "" });
          }, "Account created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Account code" {...form.register("accountCode")} />
        <Input placeholder="Account name" {...form.register("name")} />
        <Select {...form.register("accountType")}>
          <option value="asset">Asset</option>
          <option value="liability">Liability</option>
          <option value="equity">Equity</option>
          <option value="revenue">Revenue</option>
          <option value="expense">Expense</option>
        </Select>
        <Select {...form.register("normalBalance")}>
          <option value="debit">Debit</option>
          <option value="credit">Credit</option>
        </Select>
      </div>
      <Input placeholder="Description" {...form.register("description")} />
      {submit.error ? <p className="text-sm text-destructive">{submit.error}</p> : null}
      {submit.message ? <p className="text-sm text-emerald-700">{submit.message}</p> : null}
      <Button disabled={submit.isPending} type="submit">
        {submit.isPending ? "Creating..." : "Create account"}
      </Button>
    </form>
  );
}

export function CustomerForm({ data }: { data: CustomersWorkbench }) {
  const form = useForm<CreateCustomerInput>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      customerCode: "",
      legalName: "",
      displayName: "",
      email: "",
    },
  });
  const submit = useSubmitState();

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          submit.run(async () => {
            await createCustomerAction(values);
            form.reset({ ...values, customerCode: "", legalName: "", displayName: "", email: "" });
          }, "Customer created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Customer code" {...form.register("customerCode")} />
        <Input placeholder="Display name" {...form.register("displayName")} />
        <Input placeholder="Legal name" {...form.register("legalName")} />
        <Input placeholder="Email" {...form.register("email")} />
      </div>
      {submit.error ? <p className="text-sm text-destructive">{submit.error}</p> : null}
      {submit.message ? <p className="text-sm text-emerald-700">{submit.message}</p> : null}
      <Button disabled={submit.isPending} type="submit">
        {submit.isPending ? "Creating..." : "Create customer"}
      </Button>
    </form>
  );
}

export function VendorForm({ data }: { data: VendorsWorkbench }) {
  const form = useForm<CreateVendorInput>({
    resolver: zodResolver(createVendorSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      vendorCode: "",
      legalName: "",
      displayName: "",
      email: "",
      paymentTermsDays: 30,
    },
  });
  const submit = useSubmitState();

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          submit.run(async () => {
            await createVendorAction(values);
            form.reset({ ...values, vendorCode: "", legalName: "", displayName: "", email: "" });
          }, "Vendor created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Vendor code" {...form.register("vendorCode")} />
        <Input placeholder="Display name" {...form.register("displayName")} />
        <Input placeholder="Legal name" {...form.register("legalName")} />
        <Input placeholder="Email" {...form.register("email")} />
        <Input
          placeholder="Payment terms"
          type="number"
          {...form.register("paymentTermsDays", { valueAsNumber: true })}
        />
      </div>
      {submit.error ? <p className="text-sm text-destructive">{submit.error}</p> : null}
      {submit.message ? <p className="text-sm text-emerald-700">{submit.message}</p> : null}
      <Button disabled={submit.isPending} type="submit">
        {submit.isPending ? "Creating..." : "Create vendor"}
      </Button>
    </form>
  );
}

export function ProjectForm({ data }: { data: ProjectsWorkbench }) {
  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      projectCode: "",
      name: "",
      customerId: "",
      startDate: "",
      budgetAmount: 0,
    },
  });
  const submit = useSubmitState();

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          submit.run(async () => {
            await createProjectAction({
              ...values,
              budgetAmount: values.budgetAmount ? values.budgetAmount : undefined,
            });
            form.reset({ ...values, projectCode: "", name: "", customerId: "", startDate: "", budgetAmount: 0 });
          }, "Project created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Project code" {...form.register("projectCode")} />
        <Input placeholder="Project name" {...form.register("name")} />
        <Select {...form.register("customerId")}>
          <option value="">No customer</option>
          {data.customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.label}
            </option>
          ))}
        </Select>
        <Input type="date" {...form.register("startDate")} />
        <Input
          placeholder="Budget amount"
          type="number"
          step="0.01"
          {...form.register("budgetAmount", { valueAsNumber: true })}
        />
      </div>
      {submit.error ? <p className="text-sm text-destructive">{submit.error}</p> : null}
      {submit.message ? <p className="text-sm text-emerald-700">{submit.message}</p> : null}
      <Button disabled={submit.isPending} type="submit">
        {submit.isPending ? "Creating..." : "Create project"}
      </Button>
    </form>
  );
}
