"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { startTransition, useState } from "react";
import { useForm } from "react-hook-form";
import { ZodError } from "zod";

import {
  createCustomFieldAction,
  createDepartmentAction,
  createNotificationRuleAction,
  createWorkflowDefinitionAction,
} from "@/app/(dashboard)/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { SettingsWorkbench } from "@/services/operations";
import type {
  CreateCustomFieldInput,
  CreateDepartmentInput,
  CreateNotificationRuleInput,
  CreateWorkflowDefinitionInput,
} from "@/validators/operations";
import {
  createCustomFieldSchema,
  createDepartmentSchema,
  createNotificationRuleSchema,
  createWorkflowDefinitionSchema,
} from "@/validators/operations";

function useFormFeedback() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(task: () => Promise<void>, success: string) {
    setIsPending(true);
    setError(null);
    setMessage(null);
    try {
      await task();
      setMessage(success);
    } catch (err) {
      if (err instanceof ZodError) {
        setError(err.issues.map((issue) => issue.message).join(" "));
      } else {
        setError(err instanceof Error ? err.message : "Unable to save.");
      }
    } finally {
      setIsPending(false);
    }
  }

  return { isPending, error, message, run };
}

function renderFeedback(error: string | null, message: string | null) {
  return (
    <>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
    </>
  );
}

export function DepartmentForm({ data }: { data: SettingsWorkbench }) {
  const feedback = useFormFeedback();
  const form = useForm<CreateDepartmentInput>({
    resolver: zodResolver(createDepartmentSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      name: "",
      code: "",
      managerName: "",
      status: "active",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          feedback.run(async () => {
            await createDepartmentAction(values);
            form.reset({ ...values, name: "", code: "", managerName: "", status: "active" });
          }, "Department created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Input placeholder="Department name" {...form.register("name")} />
        <Input placeholder="Code" {...form.register("code")} />
        <Input placeholder="Manager name" {...form.register("managerName")} />
        <Select {...form.register("status")}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </Select>
      </div>
      {renderFeedback(feedback.error, feedback.message)}
      <Button disabled={feedback.isPending} type="submit">
        {feedback.isPending ? "Creating..." : "Create department"}
      </Button>
    </form>
  );
}

export function CustomFieldForm({ data }: { data: SettingsWorkbench }) {
  const feedback = useFormFeedback();
  const form = useForm<CreateCustomFieldInput>({
    resolver: zodResolver(createCustomFieldSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      moduleName: "customers",
      fieldKey: "",
      fieldLabel: "",
      fieldType: "text",
      optionsCsv: "",
      isRequired: false,
      status: "active",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          feedback.run(async () => {
            await createCustomFieldAction(values);
            form.reset({ ...values, fieldKey: "", fieldLabel: "", optionsCsv: "", isRequired: false });
          }, "Custom field created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Select {...form.register("moduleName")}>
          <option value="customers">Customers</option>
          <option value="vendors">Vendors</option>
          <option value="invoices">Invoices</option>
          <option value="bills">Bills</option>
          <option value="projects">Projects</option>
          <option value="assets">Assets</option>
        </Select>
        <Input placeholder="Field key" {...form.register("fieldKey")} />
        <Input placeholder="Field label" {...form.register("fieldLabel")} />
        <Select {...form.register("fieldType")}>
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="date">Date</option>
          <option value="select">Select</option>
          <option value="boolean">Boolean</option>
        </Select>
      </div>
      <Textarea placeholder="Options (comma separated for select fields)" {...form.register("optionsCsv")} />
      <div className="flex items-center gap-3 text-sm">
        <input className="h-4 w-4 rounded border-stone-300" type="checkbox" {...form.register("isRequired")} />
        <span>Required field</span>
      </div>
      {renderFeedback(feedback.error, feedback.message)}
      <Button disabled={feedback.isPending} type="submit">
        {feedback.isPending ? "Creating..." : "Create custom field"}
      </Button>
    </form>
  );
}

export function WorkflowDefinitionForm({ data }: { data: SettingsWorkbench }) {
  const feedback = useFormFeedback();
  const form = useForm<CreateWorkflowDefinitionInput>({
    resolver: zodResolver(createWorkflowDefinitionSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      workflowName: "",
      moduleName: "bills",
      triggerEvent: "submit_for_approval",
      approvalRole: "admin",
      autoApproveBelow: 0,
      status: "active",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          feedback.run(async () => {
            await createWorkflowDefinitionAction({
              ...values,
              autoApproveBelow: values.autoApproveBelow && values.autoApproveBelow > 0 ? values.autoApproveBelow : undefined,
            });
            form.reset({ ...values, workflowName: "", autoApproveBelow: 0 });
          }, "Workflow created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Input placeholder="Workflow name" {...form.register("workflowName")} />
        <Select {...form.register("moduleName")}>
          <option value="bills">Bills</option>
          <option value="invoices">Invoices</option>
          <option value="payments">Payments</option>
          <option value="journals">Journals</option>
          <option value="budgets">Budgets</option>
        </Select>
        <Input placeholder="Trigger event" {...form.register("triggerEvent")} />
        <Input placeholder="Approval role" {...form.register("approvalRole")} />
      </div>
      <Input type="number" step="0.01" placeholder="Auto approve below amount" {...form.register("autoApproveBelow", { valueAsNumber: true })} />
      {renderFeedback(feedback.error, feedback.message)}
      <Button disabled={feedback.isPending} type="submit">
        {feedback.isPending ? "Creating..." : "Create workflow"}
      </Button>
    </form>
  );
}

export function NotificationRuleForm({ data }: { data: SettingsWorkbench }) {
  const feedback = useFormFeedback();
  const form = useForm<CreateNotificationRuleInput>({
    resolver: zodResolver(createNotificationRuleSchema),
    defaultValues: {
      organizationId: data.organizationId,
      entityId: data.entityId,
      ruleName: "",
      eventKey: "",
      channel: "email",
      recipientRole: "admin",
      isEnabled: true,
      status: "active",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        startTransition(() =>
          feedback.run(async () => {
            await createNotificationRuleAction(values);
            form.reset({ ...values, ruleName: "", eventKey: "", channel: "email", recipientRole: "admin", isEnabled: true });
          }, "Notification rule created."),
        ),
      )}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Input placeholder="Rule name" {...form.register("ruleName")} />
        <Input placeholder="Event key" {...form.register("eventKey")} />
        <Select {...form.register("channel")}>
          <option value="email">Email</option>
          <option value="in_app">In-app</option>
          <option value="both">Both</option>
        </Select>
        <Input placeholder="Recipient role" {...form.register("recipientRole")} />
      </div>
      <div className="flex items-center gap-3 text-sm">
        <input className="h-4 w-4 rounded border-stone-300" type="checkbox" {...form.register("isEnabled")} />
        <span>Enabled</span>
      </div>
      {renderFeedback(feedback.error, feedback.message)}
      <Button disabled={feedback.isPending} type="submit">
        {feedback.isPending ? "Creating..." : "Create notification rule"}
      </Button>
    </form>
  );
}

const exportPresets = [
  { label: "Accounts CSV", resource: "accounts", format: "csv" },
  { label: "Customers CSV", resource: "customers", format: "csv" },
  { label: "Vendors CSV", resource: "vendors", format: "csv" },
  { label: "Departments CSV", resource: "departments", format: "csv" },
  { label: "Journals JSON", resource: "journal-entries", format: "json" },
] as const;

export function ExportCenterCard() {
  return (
    <div className="rounded-[1.8rem] border border-stone-200/80 bg-secondary/30 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-lg font-semibold">Data export hub</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Download core operational data for migration, analysis, or archival.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        {exportPresets.map((preset) => (
          <Button
            key={`${preset.resource}-${preset.format}`}
            type="button"
            variant="outline"
            onClick={() => window.open(`/api/exports/${preset.resource}?format=${preset.format}`, "_blank")}
          >
            {preset.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
