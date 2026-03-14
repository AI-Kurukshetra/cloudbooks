# CloudBooks Pro User Flow

This guide explains how a finance user can use CloudBooks Pro in day-to-day work.

## 1. Sign In

1. Open the application.
2. Go to `/login`.
3. Sign in with your email and password.
4. After login, the system opens your organization workspace.

What happens in the background:
- Your access is limited to the organization and entity you belong to.
- You only see records allowed by your role and tenant membership.

## 2. Set Up Your Accounting Foundation

Before posting transactions, create the basic structure.

### Entities

Use `/entities` to:
- create legal entities or divisions
- manage multi-entity reporting structure

Example:
- Parent Company
- India Advisory LLP
- UK Services Ltd

### Accounts

Use `/accounts` to:
- maintain the chart of accounts
- create cash, receivable, payable, revenue, expense, tax, and asset accounts

Examples:
- 1000 Cash
- 1100 Accounts Receivable
- 2000 Accounts Payable
- 4000 Advisory Revenue
- 2100 Output VAT

### Customers and Vendors

Use `/customers` and `/vendors` to:
- create customer master data
- create vendor master data
- manage who you bill and who bills you

### Fiscal Periods and Tax Rates

Use `/settings` to:
- create fiscal periods
- maintain tax rates such as VAT or sales tax
- prepare VAT returns later

## 3. Daily Operating Workflows

### A. Create a Quote or Estimate

Use `/invoices` and the **Quotes and estimates** section.

Use it when:
- you want to send pricing before creating a real invoice
- the customer has not yet accepted the deal

Flow:
1. Choose customer.
2. Add commercial lines.
3. Add tax rate if needed.
4. Create estimate.

Result:
- The estimate is saved.
- No accounting entry is posted yet.

### B. Convert Estimate to Invoice

Use `/invoices` and the **Convert estimate to invoice** section.

Flow:
1. Select an estimate.
2. Choose A/R account.
3. Set invoice date and due date.
4. Convert.

Result:
- The system creates the invoice.
- The system posts the journal automatically.

Accounting result:
- Dr Accounts Receivable
- Cr Revenue
- Cr Output Tax, if tax applies

### C. Create an Invoice Directly

Use `/invoices` and the main invoice form.

Flow:
1. Select customer.
2. Select A/R account.
3. Select tax account if tax is used.
4. Add one or more revenue lines.
5. Click **Create and post invoice**.

Result:
- Invoice is created.
- Journal is posted.
- Dashboard and reports update automatically.

### D. Schedule Reminders and Pay Links

Use `/invoices` and the **Reminders and pay links** section.

Flow:
1. Select an invoice.
2. Choose reminder type.
3. Choose delivery channel.
4. Optionally generate a pay link.
5. Schedule reminder.

Use case:
- due date reminder
- overdue reminder
- final notice

### E. Record a Vendor Bill

Use `/bills`.

Flow:
1. Select vendor.
2. Select A/P account.
3. Select tax account if tax is used.
4. Add expense lines.
5. Click **Create and post bill**.

Accounting result:
- Dr Expense
- Dr Recoverable Tax, if applicable
- Cr Accounts Payable

### F. Post a Manual Journal

Use `/journal`.

Use it when:
- adjustments are needed
- accruals are needed
- reclass entries are needed

Rules:
- total debits must equal total credits
- the system will not allow an unbalanced entry

### G. Manage Bank Accounts and Transactions

Use `/banking`.

#### Create bank setup

1. Create bank account.
2. Link it to the correct cash GL account.

#### Import bank feed

1. Import JSON transaction data.
2. System loads bank transactions.
3. Categorization rules can suggest the correct account automatically.

#### Create categorization rules

Use the **Categorization rules** section to:
- match keywords in transaction descriptions
- suggest ledger accounts
- speed up reconciliation

#### Reconciliation

Use the reconciliation form to:
- enter statement date
- enter bank statement balance
- compare with book balance

## 4. Asset and Inventory Workflows

### Fixed Assets

Use `/assets` to:
- create fixed assets
- maintain useful life
- maintain depreciation accounts
- attach supporting documents

Examples:
- laptops
- office fitout
- display systems

### Inventory

Use `/assets` and the inventory section to:
- create inventory items
- record receipts
- record issues
- record adjustments

Result:
- quantity on hand is tracked from movements

## 5. Budgeting and Planning

Use `/budgets` to:
- create a yearly or scenario budget
- assign budget values by account and period

Use case:
- budget vs actual review
- planning by department or entity

## 6. Reporting and Review

### Dashboard

Use `/dashboard` for:
- KPI cards
- recent transactions
- trend charts
- cash forecast
- receivable/payable aging signals

### Reports

Use `/reports` for:
- Trial Balance
- Profit and Loss
- Balance Sheet

These reports are based on posted accounting activity.

## 7. Tax and Compliance

Use `/settings` for:
- tax rate setup
- fiscal period control
- VAT return preparation
- workflow rules
- notification rules

VAT flow:
1. Create tax rates.
2. Use them on invoices and bills.
3. Prepare VAT return for a date range.
4. Review output tax, input tax, and net tax.

## 8. Documents and Audit

Attachments can be uploaded to:
- invoices
- bills
- assets

Why this matters:
- keeps backup with the accounting record
- supports audit and compliance review

The system also keeps audit logs for financial changes.

## 9. Core Rule of the System

CloudBooks Pro follows double-entry accounting.

This means:
- every financial transaction must create journal entries
- debits must equal credits
- invoices and bills do not bypass the ledger

If a transaction cannot create balanced accounting, the system blocks it.

## 10. Suggested First-Time Setup Order

For a new organization, use this order:

1. Create entities
2. Create chart of accounts
3. Create tax rates
4. Create fiscal periods
5. Create customers and vendors
6. Create bank accounts
7. Create projects if needed
8. Start invoices, bills, and journals
9. Review dashboard and reports

## 11. Suggested Daily User Routine

For a finance operations user:

1. Open `/dashboard`
2. Review KPIs, recent activity, and forecast
3. Create or convert estimates
4. Post invoices
5. Post vendor bills
6. Import bank transactions
7. Run reconciliations
8. Review `/reports`
9. Prepare VAT return at period end

## 12. Quick Summary

If you remember only one thing:

- Master data is created first
- Transactions are entered in invoices, bills, banking, assets, budgets, and journal
- Every financial action posts through accounting
- Reports are generated from posted entries

