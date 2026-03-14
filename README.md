# CloudBooks Pro MVP Scaffold

CloudBooks Pro is a production-oriented scaffold for a multi-tenant cloud accounting SaaS built with Next.js, TypeScript, TailwindCSS, shadcn-style primitives, and Supabase.

## Included

- Next.js App Router structure for `/login`, `/dashboard`, `/entities`, `/accounts`, `/journal`, `/invoices`, `/bills`, `/vendors`, `/customers`, `/reports`, `/banking`, `/projects`, `/assets`, `/budgets`, and `/settings`
- Normalized PostgreSQL schema for multi-entity accounting, subledgers, reporting, documents, and audit logging
- Supabase RLS policies that scope access to active organization memberships
- A reusable `accountingEngine()` that creates and posts balanced double-entry journal entries
- Server actions for invoice, bill, and manual journal creation
- Seed SQL for development data

## Core Design

- Every financially relevant module resolves to `journal_entries` and `journal_lines`
- Journal posting is controlled by the `post_journal_entry()` SQL function
- Organizations contain multiple entities, and reporting can roll up by organization
- Supabase Auth plus RLS provides tenant isolation

## Important Paths

- `supabase/migrations/001_initial_schema.sql`
- `supabase/migrations/002_rls_policies.sql`
- `supabase/seed/dev_seed.sql`
- `supabase/seed/asset_seed.sql`
- `supabase/seed/attachment_seed.sql`
- `supabase/seed/storage-manifest.json`
- `accounting/engine.ts`
- `services/invoices.ts`
- `services/bills.ts`

## Next Steps

1. Install dependencies with `npm install`
2. Configure `.env.local` from `.env.example`
3. Apply Supabase migrations and seed SQL
4. Replace static dashboard/module datasets with live Supabase queries
5. Add entity-aware report SQL views or RPCs for P&L, balance sheet, cash flow, and trial balance

## Seeded Attachments

To seed fixed assets plus attachment metadata and upload the matching sample files into Supabase Storage:

1. `psql "$SUPABASE_DB_URL" -f supabase/seed/asset_seed.sql`
2. `psql "$SUPABASE_DB_URL" -f supabase/seed/attachment_seed.sql`
3. `npm run seed:storage`

`seed:storage` uses `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from your environment and uploads the sample files listed in `supabase/seed/storage-manifest.json` into the `documents` bucket.
