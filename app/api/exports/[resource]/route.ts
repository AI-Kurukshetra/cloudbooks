import { NextResponse } from "next/server";

import { requireActiveMembership } from "@/services/auth";
import { createServerSupabaseClient } from "@/supabase/server";

type ResourceConfig = {
  table: string;
  select: string;
  orderBy: string;
  fileName: string;
};

const resourceMap: Record<string, ResourceConfig> = {
  accounts: {
    table: "chart_of_accounts",
    select: "account_code, name, account_type, normal_balance, currency_code, is_active",
    orderBy: "account_code",
    fileName: "accounts",
  },
  customers: {
    table: "customers",
    select: "customer_code, display_name, legal_name, email, status",
    orderBy: "display_name",
    fileName: "customers",
  },
  vendors: {
    table: "vendors",
    select: "vendor_code, display_name, legal_name, email, payment_terms, status",
    orderBy: "display_name",
    fileName: "vendors",
  },
  departments: {
    table: "departments",
    select: "code, name, manager_name, status",
    orderBy: "name",
    fileName: "departments",
  },
  "journal-entries": {
    table: "journal_entries",
    select: "entry_number, entry_date, description, source_type, status, currency_code, external_reference",
    orderBy: "entry_date",
    fileName: "journal_entries",
  },
};

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) {
    return "";
  }
  const headers = Object.keys(rows[0]);
  const lines = rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","));
  return [headers.join(","), ...lines].join("\n");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ resource: string }> },
) {
  const membership = await requireActiveMembership();
  const { resource } = await params;
  const config = resourceMap[resource];

  if (!config) {
    return NextResponse.json({ ok: false, message: "Unsupported export resource." }, { status: 404 });
  }

  const format = new URL(request.url).searchParams.get("format") === "json" ? "json" : "csv";
  const supabase = await createServerSupabaseClient();
  const db = supabase as any;

  let query = db
    .from(config.table)
    .select(config.select)
    .eq("organization_id", membership.organizationId)
    .order(config.orderBy, { ascending: true });

  if (membership.entityId) {
    query = query.eq("entity_id", membership.entityId);
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const timestamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${config.fileName}_${timestamp}.json"`,
      },
    });
  }

  return new NextResponse(toCsv(rows), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${config.fileName}_${timestamp}.csv"`,
    },
  });
}
