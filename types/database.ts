export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UUID = string;

type TableDefinition<Row, Insert = Row, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
};

type BaseRow = {
  id: UUID;
  organization_id: UUID | null;
  entity_id: UUID | null;
  created_at: string;
  updated_at: string;
};

type BaseInsert = {
  id?: UUID;
  organization_id?: UUID | null;
  entity_id?: UUID | null;
  created_at?: string;
  updated_at?: string;
};

export type Database = {
  public: {
    Tables: {
      organizations: TableDefinition<
        BaseRow & {
          name: string;
          legal_name: string | null;
          base_currency_code: string;
          status: string;
        },
        BaseInsert & {
          name: string;
          legal_name?: string | null;
          base_currency_code?: string;
          status?: string;
        }
      >;
      entities: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          name: string;
          legal_name: string | null;
          code: string;
          jurisdiction: string | null;
          reporting_currency_code: string;
          is_consolidation: boolean;
        },
        BaseInsert & {
          organization_id: UUID;
          name: string;
          legal_name?: string | null;
          code: string;
          jurisdiction?: string | null;
          reporting_currency_code?: string;
          is_consolidation?: boolean;
        }
      >;
      users: TableDefinition<
        BaseRow & {
          id: UUID;
          full_name: string;
          email: string;
          job_title: string | null;
        },
        BaseInsert & {
          id: UUID;
          full_name: string;
          email: string;
          job_title?: string | null;
        }
      >;
      roles: TableDefinition<
        BaseRow & {
          name: string;
          description: string | null;
          permissions: Json;
        },
        BaseInsert & {
          name: string;
          description?: string | null;
          permissions?: Json;
        }
      >;
      memberships: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          user_id: UUID;
          role_id: UUID;
          status: "invited" | "active" | "suspended";
          is_default: boolean;
        },
        BaseInsert & {
          organization_id: UUID;
          user_id: UUID;
          role_id: UUID;
          status?: "invited" | "active" | "suspended";
          is_default?: boolean;
        }
      >;
      fiscal_periods: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          period_name: string;
          starts_on: string;
          ends_on: string;
          status: string;
          is_adjustment_period: boolean;
        },
        BaseInsert & {
          organization_id: UUID;
          period_name: string;
          starts_on: string;
          ends_on: string;
          status?: string;
          is_adjustment_period?: boolean;
        }
      >;
      currencies: TableDefinition<
        BaseRow & {
          code: string;
          name: string;
          symbol: string;
          decimal_places: number;
        },
        BaseInsert & {
          code: string;
          name: string;
          symbol: string;
          decimal_places?: number;
        }
      >;
      exchange_rates: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          from_currency_code: string;
          to_currency_code: string;
          rate: number;
          effective_on: string;
          source: string | null;
        },
        BaseInsert & {
          organization_id: UUID;
          from_currency_code: string;
          to_currency_code: string;
          rate: number;
          effective_on: string;
          source?: string | null;
        }
      >;
      chart_of_accounts: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          account_code: string;
          name: string;
          description: string | null;
          account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
          normal_balance: "debit" | "credit";
          parent_account_id: UUID | null;
          currency_code: string;
          is_active: boolean;
          allow_manual_posting: boolean;
        },
        BaseInsert & {
          organization_id: UUID;
          account_code: string;
          name: string;
          description?: string | null;
          account_type: "asset" | "liability" | "equity" | "revenue" | "expense";
          normal_balance: "debit" | "credit";
          parent_account_id?: UUID | null;
          currency_code?: string;
          is_active?: boolean;
          allow_manual_posting?: boolean;
        }
      >;
      journal_entries: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          fiscal_period_id: UUID | null;
          entry_number: string;
          entry_date: string;
          description: string;
          status: "draft" | "posted" | "reversed";
          source_type: string;
          source_id: UUID | null;
          currency_code: string;
          exchange_rate: number;
          external_reference: string | null;
          posted_at: string | null;
          posted_by: UUID | null;
          reversed_entry_id: UUID | null;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          fiscal_period_id?: UUID | null;
          entry_number: string;
          entry_date: string;
          description: string;
          status?: "draft" | "posted" | "reversed";
          source_type: string;
          source_id?: UUID | null;
          currency_code: string;
          exchange_rate?: number;
          external_reference?: string | null;
          posted_at?: string | null;
          posted_by?: UUID | null;
          reversed_entry_id?: UUID | null;
        }
      >;
      journal_lines: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          journal_entry_id: UUID;
          account_id: UUID;
          description: string | null;
          line_number: number;
          debit_amount: number;
          credit_amount: number;
          currency_amount: number;
          department: string | null;
          project_id: UUID | null;
          customer_id: UUID | null;
          vendor_id: UUID | null;
          tax_rate_id: UUID | null;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          journal_entry_id: UUID;
          account_id: UUID;
          description?: string | null;
          line_number: number;
          debit_amount?: number;
          credit_amount?: number;
          currency_amount?: number;
          department?: string | null;
          project_id?: UUID | null;
          customer_id?: UUID | null;
          vendor_id?: UUID | null;
          tax_rate_id?: UUID | null;
        }
      >;
      vendors: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          vendor_code: string;
          legal_name: string;
          display_name: string;
          tax_identifier: string | null;
          email: string | null;
          payment_terms_days: number;
          status: string;
        },
        BaseInsert & {
          organization_id: UUID;
          vendor_code: string;
          legal_name: string;
          display_name: string;
          tax_identifier?: string | null;
          email?: string | null;
          payment_terms_days?: number;
          status?: string;
        }
      >;
      customers: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          customer_code: string;
          legal_name: string;
          display_name: string;
          tax_identifier: string | null;
          email: string | null;
          status: string;
        },
        BaseInsert & {
          organization_id: UUID;
          customer_code: string;
          legal_name: string;
          display_name: string;
          tax_identifier?: string | null;
          email?: string | null;
          status?: string;
        }
      >;
      invoices: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          customer_id: UUID;
          fiscal_period_id: UUID | null;
          invoice_number: string;
          invoice_date: string;
          due_date: string;
          status: "draft" | "approved" | "sent" | "partially_paid" | "paid" | "void";
          currency_code: string;
          subtotal_amount: number;
          tax_amount: number;
          total_amount: number;
          outstanding_amount: number;
          revenue_start_date: string | null;
          revenue_end_date: string | null;
          recognized_amount: number;
          journal_entry_id: UUID | null;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          customer_id: UUID;
          fiscal_period_id?: UUID | null;
          invoice_number: string;
          invoice_date: string;
          due_date: string;
          status?: "draft" | "approved" | "sent" | "partially_paid" | "paid" | "void";
          currency_code: string;
          subtotal_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          outstanding_amount?: number;
          revenue_start_date?: string | null;
          revenue_end_date?: string | null;
          recognized_amount?: number;
          journal_entry_id?: UUID | null;
        }
      >;
      invoice_lines: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          invoice_id: UUID;
          line_number: number;
          description: string;
          quantity: number;
          unit_price: number;
          line_amount: number;
          revenue_account_id: UUID;
          project_id: UUID | null;
          tax_rate_id: UUID | null;
          recognition_start_date: string | null;
          recognition_end_date: string | null;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          invoice_id: UUID;
          line_number: number;
          description: string;
          quantity?: number;
          unit_price?: number;
          line_amount?: number;
          revenue_account_id: UUID;
          project_id?: UUID | null;
          tax_rate_id?: UUID | null;
          recognition_start_date?: string | null;
          recognition_end_date?: string | null;
        }
      >;
      payments: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          customer_id: UUID | null;
          invoice_id: UUID | null;
          bill_id: UUID | null;
          bank_account_id: UUID | null;
          payment_date: string;
          payment_reference: string;
          payment_method: string;
          currency_code: string;
          amount: number;
          direction: "inbound" | "outbound";
          journal_entry_id: UUID | null;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          customer_id?: UUID | null;
          invoice_id?: UUID | null;
          bill_id?: UUID | null;
          bank_account_id?: UUID | null;
          payment_date: string;
          payment_reference: string;
          payment_method: string;
          currency_code: string;
          amount: number;
          direction: "inbound" | "outbound";
          journal_entry_id?: UUID | null;
        }
      >;
      bills: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          vendor_id: UUID;
          fiscal_period_id: UUID | null;
          bill_number: string;
          bill_date: string;
          due_date: string;
          status: "draft" | "approved" | "scheduled" | "partially_paid" | "paid" | "void";
          currency_code: string;
          subtotal_amount: number;
          tax_amount: number;
          total_amount: number;
          outstanding_amount: number;
          approval_state: string;
          journal_entry_id: UUID | null;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          vendor_id: UUID;
          fiscal_period_id?: UUID | null;
          bill_number: string;
          bill_date: string;
          due_date: string;
          status?: "draft" | "approved" | "scheduled" | "partially_paid" | "paid" | "void";
          currency_code: string;
          subtotal_amount?: number;
          tax_amount?: number;
          total_amount?: number;
          outstanding_amount?: number;
          approval_state?: string;
          journal_entry_id?: UUID | null;
        }
      >;
      bill_lines: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          bill_id: UUID;
          line_number: number;
          description: string;
          quantity: number;
          unit_cost: number;
          line_amount: number;
          expense_account_id: UUID;
          project_id: UUID | null;
          tax_rate_id: UUID | null;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          bill_id: UUID;
          line_number: number;
          description: string;
          quantity?: number;
          unit_cost?: number;
          line_amount?: number;
          expense_account_id: UUID;
          project_id?: UUID | null;
          tax_rate_id?: UUID | null;
        }
      >;
      bank_accounts: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          account_name: string;
          bank_name: string;
          masked_account_number: string;
          currency_code: string;
          chart_account_id: UUID;
          integration_provider: string | null;
          integration_reference: string | null;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          account_name: string;
          bank_name: string;
          masked_account_number: string;
          currency_code: string;
          chart_account_id: UUID;
          integration_provider?: string | null;
          integration_reference?: string | null;
        }
      >;
      bank_transactions: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          bank_account_id: UUID;
          transaction_date: string;
          posted_date: string | null;
          description: string;
          amount: number;
          direction: "credit" | "debit";
          status: string;
          external_id: string | null;
          journal_entry_id: UUID | null;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          bank_account_id: UUID;
          transaction_date: string;
          posted_date?: string | null;
          description: string;
          amount: number;
          direction: "credit" | "debit";
          status?: string;
          external_id?: string | null;
          journal_entry_id?: UUID | null;
        }
      >;
      reconciliations: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          bank_account_id: UUID;
          statement_ending_on: string;
          statement_balance: number;
          book_balance: number;
          status: string;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          bank_account_id: UUID;
          statement_ending_on: string;
          statement_balance: number;
          book_balance: number;
          status?: string;
        }
      >;
      assets: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          asset_code: string;
          name: string;
          category: string;
          acquisition_date: string;
          in_service_date: string;
          cost: number;
          salvage_value: number;
          useful_life_months: number;
          depreciation_method: string;
          asset_account_id: UUID;
          accumulated_depreciation_account_id: UUID;
          depreciation_expense_account_id: UUID;
          status: string;
          disposal_date: string | null;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          asset_code: string;
          name: string;
          category: string;
          acquisition_date: string;
          in_service_date: string;
          cost: number;
          salvage_value?: number;
          useful_life_months: number;
          depreciation_method?: string;
          asset_account_id: UUID;
          accumulated_depreciation_account_id: UUID;
          depreciation_expense_account_id: UUID;
          status?: string;
          disposal_date?: string | null;
        }
      >;
      depreciation_schedules: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          asset_id: UUID;
          schedule_date: string;
          depreciation_amount: number;
          accumulated_depreciation: number;
          net_book_value: number;
          journal_entry_id: UUID | null;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          asset_id: UUID;
          schedule_date: string;
          depreciation_amount: number;
          accumulated_depreciation: number;
          net_book_value: number;
          journal_entry_id?: UUID | null;
        }
      >;
      projects: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          project_code: string;
          name: string;
          customer_id: UUID | null;
          status: string;
          start_date: string | null;
          end_date: string | null;
          budget_amount: number | null;
        },
        BaseInsert & {
          organization_id: UUID;
          project_code: string;
          name: string;
          customer_id?: UUID | null;
          status?: string;
          start_date?: string | null;
          end_date?: string | null;
          budget_amount?: number | null;
        }
      >;
      project_transactions: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          entity_id: UUID;
          project_id: UUID;
          transaction_date: string;
          source_type: string;
          source_id: UUID | null;
          amount: number;
          cost_or_revenue: "cost" | "revenue";
          journal_line_id: UUID | null;
        },
        BaseInsert & {
          organization_id: UUID;
          entity_id: UUID;
          project_id: UUID;
          transaction_date: string;
          source_type: string;
          source_id?: UUID | null;
          amount: number;
          cost_or_revenue: "cost" | "revenue";
          journal_line_id?: UUID | null;
        }
      >;
      budgets: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          name: string;
          fiscal_year: number;
          scenario: string;
          status: string;
        },
        BaseInsert & {
          organization_id: UUID;
          name: string;
          fiscal_year: number;
          scenario?: string;
          status?: string;
        }
      >;
      budget_lines: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          budget_id: UUID;
          account_id: UUID;
          fiscal_period_id: UUID | null;
          amount: number;
        },
        BaseInsert & {
          organization_id: UUID;
          budget_id: UUID;
          account_id: UUID;
          fiscal_period_id?: UUID | null;
          amount: number;
        }
      >;
      tax_rates: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          name: string;
          tax_code: string;
          rate: number;
          recoverable_percent: number;
          jurisdiction: string | null;
        },
        BaseInsert & {
          organization_id: UUID;
          name: string;
          tax_code: string;
          rate: number;
          recoverable_percent?: number;
          jurisdiction?: string | null;
        }
      >;
      documents: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          document_type: "invoice" | "bill" | "bank_statement" | "contract" | "receipt" | "other";
          storage_bucket: string;
          storage_path: string;
          file_name: string;
          file_size_bytes: number | null;
          mime_type: string | null;
          related_table: string | null;
          related_record_id: UUID | null;
          created_by: UUID | null;
        },
        BaseInsert & {
          organization_id: UUID;
          document_type: "invoice" | "bill" | "bank_statement" | "contract" | "receipt" | "other";
          storage_bucket?: string;
          storage_path: string;
          file_name: string;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          related_table?: string | null;
          related_record_id?: UUID | null;
          created_by?: UUID | null;
        }
      >;
      payroll_integrations: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          provider_name: string;
          external_company_id: string | null;
          liability_account_id: UUID | null;
          expense_account_id: UUID | null;
          last_sync_at: string | null;
        },
        BaseInsert & {
          organization_id: UUID;
          provider_name: string;
          external_company_id?: string | null;
          liability_account_id?: UUID | null;
          expense_account_id?: UUID | null;
          last_sync_at?: string | null;
        }
      >;
      inventory_items: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          sku: string;
          name: string;
          item_type: string;
          asset_account_id: UUID | null;
          cogs_account_id: UUID | null;
          revenue_account_id: UUID | null;
          unit_of_measure: string;
          is_active: boolean;
        },
        BaseInsert & {
          organization_id: UUID;
          sku: string;
          name: string;
          item_type?: string;
          asset_account_id?: UUID | null;
          cogs_account_id?: UUID | null;
          revenue_account_id?: UUID | null;
          unit_of_measure?: string;
          is_active?: boolean;
        }
      >;
      inventory_movements: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          inventory_item_id: UUID;
          movement_date: string;
          movement_type: string;
          quantity: number;
          unit_cost: number | null;
          source_type: string | null;
          source_id: UUID | null;
          journal_entry_id: UUID | null;
        },
        BaseInsert & {
          organization_id: UUID;
          inventory_item_id: UUID;
          movement_date: string;
          movement_type: string;
          quantity: number;
          unit_cost?: number | null;
          source_type?: string | null;
          source_id?: UUID | null;
          journal_entry_id?: UUID | null;
        }
      >;
      time_entries: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          project_id: UUID | null;
          user_id: UUID | null;
          work_date: string;
          hours: number;
          billable_rate: number | null;
          cost_rate: number | null;
          description: string | null;
          approval_status: string;
        },
        BaseInsert & {
          organization_id: UUID;
          project_id?: UUID | null;
          user_id?: UUID | null;
          work_date: string;
          hours: number;
          billable_rate?: number | null;
          cost_rate?: number | null;
          description?: string | null;
          approval_status?: string;
        }
      >;
      expense_entries: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          project_id: UUID | null;
          user_id: UUID | null;
          expense_date: string;
          category: string;
          amount: number;
          currency_code: string;
          billable: boolean;
          reimbursement_status: string;
          document_id: UUID | null;
          journal_entry_id: UUID | null;
        },
        BaseInsert & {
          organization_id: UUID;
          project_id?: UUID | null;
          user_id?: UUID | null;
          expense_date: string;
          category: string;
          amount: number;
          currency_code: string;
          billable?: boolean;
          reimbursement_status?: string;
          document_id?: UUID | null;
          journal_entry_id?: UUID | null;
        }
      >;
      audit_logs: TableDefinition<
        BaseRow & {
          organization_id: UUID;
          actor_user_id: UUID | null;
          table_name: string;
          record_id: UUID;
          action: string;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
        },
        BaseInsert & {
          organization_id: UUID;
          actor_user_id?: UUID | null;
          table_name: string;
          record_id: UUID;
          action: string;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
        }
      >;
    };
  };
};
