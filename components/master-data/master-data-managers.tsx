"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import {
  archiveAccountAction,
  createAccountAction,
  updateAccountAction,
} from "@/app/(dashboard)/accounts/actions";
import { updateCustomerAction } from "@/app/(dashboard)/customers/actions";
import { createEntityAction, updateEntityAction } from "@/app/(dashboard)/entities/actions";
import { updateProjectAction } from "@/app/(dashboard)/projects/actions";
import { updateVendorAction } from "@/app/(dashboard)/vendors/actions";
import { AccountForm, CustomerForm, ProjectForm, VendorForm } from "@/components/forms/master-data-forms";
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
  createEntitySchema,
  updateAccountSchema,
  updateCustomerSchema,
  updateEntitySchema,
  updateProjectSchema,
  updateVendorSchema,
  type CreateAccountInput,
  type CreateEntityInput,
  type UpdateAccountInput,
  type UpdateCustomerInput,
  type UpdateEntityInput,
  type UpdateProjectInput,
  type UpdateVendorInput,
} from "@/validators/master-data";

function fieldError(message?: string) {
  return message ? <p className="text-xs text-destructive">{message}</p> : null;
}

function EntityEditor({
  data,
  onCancel,
}: {
  data: EntitiesWorkbench;
  onCancel: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const entityLookup = useMemo(() => new Map(data.entities.map((item) => [item.id, item])), [data.entities]);
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

  function resetForm() {
    setEditingId(null);
    setError(null);
    form.reset({
      organizationId: data.organizationId,
      reportingCurrencyCode: data.reportingCurrencyCode,
      name: "",
      legalName: "",
      code: "",
      jurisdiction: "",
    });
  }

  function edit(id: string) {
    const entity = entityLookup.get(id);
    if (!entity) return;
    setEditingId(id);
    setMessage(null);
    setError(null);
    form.reset({
      organizationId: data.organizationId,
      reportingCurrencyCode: entity.reportingCurrencyCode,
      name: entity.name,
      legalName: entity.legalName ?? "",
      code: entity.code,
      jurisdiction: entity.jurisdiction ?? "",
    });
  }

  function submit(values: CreateEntityInput) {
    setIsPending(true);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        if (editingId) {
          await updateEntityAction({
            entityId: editingId,
            ...values,
          } satisfies UpdateEntityInput);
          setMessage("Entity updated.");
        } else {
          await createEntityAction(values);
          setMessage("Entity created.");
        }
        resetForm();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Unable to save entity.");
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
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Entity editor</p>
            <h3 className="mt-2 text-xl font-semibold">{editingId ? "Update entity" : "Create entity"}</h3>
          </div>
          {editingId ? (
            <Button onClick={resetForm} type="button" variant="secondary">
              New entity
            </Button>
          ) : null}
        </div>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(submit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Entity name</label>
              <Input {...form.register("name")} />
              {fieldError(errors.name?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Code</label>
              <Input {...form.register("code")} />
              {fieldError(errors.code?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Legal name</label>
              <Input {...form.register("legalName")} />
              {fieldError(errors.legalName?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Jurisdiction</label>
              <Input {...form.register("jurisdiction")} />
              {fieldError(errors.jurisdiction?.message)}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Reporting currency</label>
            <Input {...form.register("reportingCurrencyCode")} />
            {fieldError(errors.reportingCurrencyCode?.message)}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <div className="flex gap-3">
            <Button disabled={isPending} type="submit">
              {isPending ? "Saving..." : editingId ? "Save entity" : "Create entity"}
            </Button>
            <Button onClick={onCancel} type="button" variant="ghost">
              Close
            </Button>
          </div>
        </form>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Entity list</p>
        <h3 className="mt-2 text-xl font-semibold">Organization structure</h3>
        <div className="mt-5 space-y-3">
          {data.entities.map((entity) => (
            <div key={entity.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{entity.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {entity.code} · {entity.jurisdiction ?? "N/A"} · {entity.reportingCurrencyCode}
                  </p>
                </div>
                <Button onClick={() => edit(entity.id)} type="button" variant="secondary">
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AccountEditor({
  data,
  onCancel,
}: {
  data: AccountsWorkbench;
  onCancel: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const accountLookup = useMemo(() => new Map(data.accounts.map((item) => [item.id, item])), [data.accounts]);
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

  function resetForm() {
    setEditingId(null);
    setError(null);
    form.reset({
      organizationId: data.organizationId,
      entityId: data.entityId,
      accountCode: "",
      name: "",
      description: "",
      accountType: "expense",
      normalBalance: "debit",
      currencyCode: data.currencyCode,
    });
  }

  function edit(id: string) {
    const account = accountLookup.get(id);
    if (!account) return;
    setEditingId(id);
    setMessage(null);
    setError(null);
    form.reset({
      organizationId: data.organizationId,
      entityId: data.entityId,
      accountCode: account.accountCode,
      name: account.name,
      description: account.description ?? "",
      accountType: account.accountType,
      normalBalance: account.normalBalance,
      currencyCode: account.currencyCode,
    });
  }

  function submit(values: CreateAccountInput) {
    setIsPending(true);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        if (editingId) {
          const current = accountLookup.get(editingId);
          await updateAccountAction({
            accountId: editingId,
            isActive: current?.isActive ?? true,
            ...values,
          } satisfies UpdateAccountInput);
          setMessage("Account updated.");
        } else {
          await createAccountAction(values);
          setMessage("Account created.");
        }
        resetForm();
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Unable to save account.");
      } finally {
        setIsPending(false);
      }
    });
  }

  function toggleActive(id: string, isActive: boolean) {
    setIsPending(true);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await archiveAccountAction({
          accountId: id,
          organizationId: data.organizationId,
          entityId: data.entityId,
          isActive: !isActive,
        });
        setMessage(isActive ? "Account deactivated." : "Account reactivated.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Unable to update account status.");
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
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Account editor</p>
            <h3 className="mt-2 text-xl font-semibold">{editingId ? "Update account" : "Create account"}</h3>
          </div>
          {editingId ? (
            <Button onClick={resetForm} type="button" variant="secondary">
              New account
            </Button>
          ) : null}
        </div>
        <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(submit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Account code</label>
              <Input {...form.register("accountCode")} />
              {fieldError(errors.accountCode?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Account name</label>
              <Input {...form.register("name")} />
              {fieldError(errors.name?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Account type</label>
              <Select {...form.register("accountType")}>
                <option value="asset">Asset</option>
                <option value="liability">Liability</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </Select>
              {fieldError(errors.accountType?.message)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Normal balance</label>
              <Select {...form.register("normalBalance")}>
                <option value="debit">Debit</option>
                <option value="credit">Credit</option>
              </Select>
              {fieldError(errors.normalBalance?.message)}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Input {...form.register("description")} />
            {fieldError(errors.description?.message)}
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          <div className="flex gap-3">
            <Button disabled={isPending} type="submit">
              {isPending ? "Saving..." : editingId ? "Save account" : "Create account"}
            </Button>
            <Button onClick={onCancel} type="button" variant="ghost">
              Close
            </Button>
          </div>
        </form>
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Chart maintenance</p>
        <h3 className="mt-2 text-xl font-semibold">Account list</h3>
        <div className="mt-5 space-y-3">
          {data.accounts.map((account) => (
            <div key={account.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {account.accountCode} · {account.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {account.accountType} · {account.normalBalance} · {account.isActive ? "active" : "inactive"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => edit(account.id)} type="button" variant="secondary">
                    Edit
                  </Button>
                  <Button onClick={() => toggleActive(account.id, account.isActive)} type="button" variant="ghost">
                    {account.isActive ? "Deactivate" : "Activate"}
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

type StatusEditorProps<TWorkbench> = {
  data: TWorkbench;
  onCancel: () => void;
};

function CustomerEditor({ data, onCancel }: StatusEditorProps<CustomersWorkbench>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const customerLookup = useMemo(() => new Map(data.customers.map((item) => [item.id, item])), [data.customers]);
  const form = useForm<UpdateCustomerInput>({
    resolver: zodResolver(updateCustomerSchema),
    defaultValues: {
      customerId: "",
      organizationId: data.organizationId,
      entityId: data.entityId,
      customerCode: "",
      legalName: "",
      displayName: "",
      email: "",
      status: "active",
    },
  });

  function edit(id: string) {
    const customer = customerLookup.get(id);
    if (!customer) return;
    setEditingId(id);
    setError(null);
    setMessage(null);
    form.reset({
      customerId: customer.id,
      organizationId: data.organizationId,
      entityId: data.entityId,
      customerCode: customer.customerCode,
      legalName: customer.legalName,
      displayName: customer.displayName,
      email: customer.email ?? "",
      status: customer.status,
    });
  }

  function submit(values: UpdateCustomerInput) {
    setIsPending(true);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await updateCustomerAction(values);
        setMessage("Customer updated.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Unable to update customer.");
      } finally {
        setIsPending(false);
      }
    });
  }

  const errors = form.formState.errors;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Customer maintenance</p>
        <h3 className="mt-2 text-xl font-semibold">{editingId ? "Update customer" : "Create customer"}</h3>
        {!editingId ? <div className="mt-6"><CustomerForm data={data} /></div> : null}
        {editingId ? (
          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(submit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer code</label>
                <Input {...form.register("customerCode")} />
                {fieldError(errors.customerCode?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Display name</label>
                <Input {...form.register("displayName")} />
                {fieldError(errors.displayName?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Legal name</label>
                <Input {...form.register("legalName")} />
                {fieldError(errors.legalName?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input {...form.register("email")} />
                {fieldError(errors.email?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select {...form.register("status")}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            <div className="flex gap-3">
              <Button disabled={isPending} type="submit">
                {isPending ? "Saving..." : "Save customer"}
              </Button>
              <Button onClick={() => setEditingId(null)} type="button" variant="secondary">
                New customer
              </Button>
              <Button onClick={onCancel} type="button" variant="ghost">
                Close
              </Button>
            </div>
          </form>
        ) : null}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Customer list</p>
        <h3 className="mt-2 text-xl font-semibold">Existing customers</h3>
        <div className="mt-5 space-y-3">
          {data.customers.map((customer) => (
            <div key={customer.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{customer.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {customer.customerCode} · {customer.email ?? "No email"} · {customer.status}
                  </p>
                </div>
                <Button onClick={() => edit(customer.id)} type="button" variant="secondary">
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function VendorEditor({ data, onCancel }: StatusEditorProps<VendorsWorkbench>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const vendorLookup = useMemo(() => new Map(data.vendors.map((item) => [item.id, item])), [data.vendors]);
  const form = useForm<UpdateVendorInput>({
    resolver: zodResolver(updateVendorSchema),
    defaultValues: {
      vendorId: "",
      organizationId: data.organizationId,
      entityId: data.entityId,
      vendorCode: "",
      legalName: "",
      displayName: "",
      email: "",
      paymentTermsDays: 30,
      status: "active",
    },
  });

  function edit(id: string) {
    const vendor = vendorLookup.get(id);
    if (!vendor) return;
    setEditingId(id);
    setError(null);
    setMessage(null);
    form.reset({
      vendorId: vendor.id,
      organizationId: data.organizationId,
      entityId: data.entityId,
      vendorCode: vendor.vendorCode,
      legalName: vendor.legalName,
      displayName: vendor.displayName,
      email: vendor.email ?? "",
      paymentTermsDays: vendor.paymentTermsDays,
      status: vendor.status,
    });
  }

  function submit(values: UpdateVendorInput) {
    setIsPending(true);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await updateVendorAction(values);
        setMessage("Vendor updated.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Unable to update vendor.");
      } finally {
        setIsPending(false);
      }
    });
  }

  const errors = form.formState.errors;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Vendor maintenance</p>
        <h3 className="mt-2 text-xl font-semibold">{editingId ? "Update vendor" : "Create vendor"}</h3>
        {!editingId ? <div className="mt-6"><VendorForm data={data} /></div> : null}
        {editingId ? (
          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(submit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Vendor code</label>
                <Input {...form.register("vendorCode")} />
                {fieldError(errors.vendorCode?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Display name</label>
                <Input {...form.register("displayName")} />
                {fieldError(errors.displayName?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Legal name</label>
                <Input {...form.register("legalName")} />
                {fieldError(errors.legalName?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input {...form.register("email")} />
                {fieldError(errors.email?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Payment terms (days)</label>
                <Input type="number" {...form.register("paymentTermsDays", { valueAsNumber: true })} />
                {fieldError(errors.paymentTermsDays?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select {...form.register("status")}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            <div className="flex gap-3">
              <Button disabled={isPending} type="submit">
                {isPending ? "Saving..." : "Save vendor"}
              </Button>
              <Button onClick={() => setEditingId(null)} type="button" variant="secondary">
                New vendor
              </Button>
              <Button onClick={onCancel} type="button" variant="ghost">
                Close
              </Button>
            </div>
          </form>
        ) : null}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Vendor list</p>
        <h3 className="mt-2 text-xl font-semibold">Existing vendors</h3>
        <div className="mt-5 space-y-3">
          {data.vendors.map((vendor) => (
            <div key={vendor.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{vendor.displayName}</p>
                  <p className="text-sm text-muted-foreground">
                    {vendor.vendorCode} · {vendor.paymentTermsDays} days · {vendor.status}
                  </p>
                </div>
                <Button onClick={() => edit(vendor.id)} type="button" variant="secondary">
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProjectEditor({ data, onCancel }: StatusEditorProps<ProjectsWorkbench>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const projectLookup = useMemo(() => new Map(data.projects.map((item) => [item.id, item])), [data.projects]);
  const form = useForm<UpdateProjectInput>({
    resolver: zodResolver(updateProjectSchema),
    defaultValues: {
      projectId: "",
      organizationId: data.organizationId,
      entityId: data.entityId,
      projectCode: "",
      name: "",
      customerId: "",
      startDate: "",
      budgetAmount: 0,
      status: "active",
    },
  });

  function edit(id: string) {
    const project = projectLookup.get(id);
    if (!project) return;
    setEditingId(id);
    setError(null);
    setMessage(null);
    form.reset({
      projectId: project.id,
      organizationId: data.organizationId,
      entityId: data.entityId,
      projectCode: project.projectCode,
      name: project.name,
      customerId: project.customerId ?? "",
      startDate: project.startDate ?? "",
      budgetAmount: project.budgetAmount ?? 0,
      status: project.status,
    });
  }

  function submit(values: UpdateProjectInput) {
    setIsPending(true);
    setError(null);
    setMessage(null);
    startTransition(async () => {
      try {
        await updateProjectAction({
          ...values,
          budgetAmount: values.budgetAmount ? values.budgetAmount : undefined,
        });
        setMessage("Project updated.");
      } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : "Unable to update project.");
      } finally {
        setIsPending(false);
      }
    });
  }

  const errors = form.formState.errors;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Project maintenance</p>
        <h3 className="mt-2 text-xl font-semibold">{editingId ? "Update project" : "Create project"}</h3>
        {!editingId ? <div className="mt-6"><ProjectForm data={data} /></div> : null}
        {editingId ? (
          <form className="mt-6 space-y-4" onSubmit={form.handleSubmit(submit)}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project code</label>
                <Input {...form.register("projectCode")} />
                {fieldError(errors.projectCode?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Project name</label>
                <Input {...form.register("name")} />
                {fieldError(errors.name?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Customer</label>
                <Select {...form.register("customerId")}>
                  <option value="">No customer</option>
                  {data.customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.label}
                    </option>
                  ))}
                </Select>
                {fieldError(errors.customerId?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Start date</label>
                <Input type="date" {...form.register("startDate")} />
                {fieldError(errors.startDate?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Budget amount</label>
                <Input type="number" step="0.01" {...form.register("budgetAmount", { valueAsNumber: true })} />
                {fieldError(errors.budgetAmount?.message)}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select {...form.register("status")}>
                  <option value="active">Active</option>
                  <option value="on_hold">On hold</option>
                  <option value="closed">Closed</option>
                </Select>
              </div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            <div className="flex gap-3">
              <Button disabled={isPending} type="submit">
                {isPending ? "Saving..." : "Save project"}
              </Button>
              <Button onClick={() => setEditingId(null)} type="button" variant="secondary">
                New project
              </Button>
              <Button onClick={onCancel} type="button" variant="ghost">
                Close
              </Button>
            </div>
          </form>
        ) : null}
      </div>
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Project list</p>
        <h3 className="mt-2 text-xl font-semibold">Existing projects</h3>
        <div className="mt-5 space-y-3">
          {data.projects.map((project) => (
            <div key={project.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{project.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {project.projectCode} · {project.budgetAmount ?? 0} · {project.status}
                  </p>
                </div>
                <Button onClick={() => edit(project.id)} type="button" variant="secondary">
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function EntityManager({ data }: { data: EntitiesWorkbench }) {
  return <EntityEditor data={data} onCancel={() => undefined} />;
}

export function AccountManager({ data }: { data: AccountsWorkbench }) {
  return <AccountEditor data={data} onCancel={() => undefined} />;
}

export function CustomerManager({ data }: { data: CustomersWorkbench }) {
  return <CustomerEditor data={data} onCancel={() => undefined} />;
}

export function VendorManager({ data }: { data: VendorsWorkbench }) {
  return <VendorEditor data={data} onCancel={() => undefined} />;
}

export function ProjectManager({ data }: { data: ProjectsWorkbench }) {
  return <ProjectEditor data={data} onCancel={() => undefined} />;
}
