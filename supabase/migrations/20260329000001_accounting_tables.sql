-- =============================================
-- 會計自動化系統 - 資料庫結構
-- =============================================

-- 1. 客戶表 (用於 AR)
CREATE TABLE IF NOT EXISTS public.accounting_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 2. 供應商表 (用於 AP)
CREATE TABLE IF NOT EXISTS public.accounting_suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  tax_id TEXT,
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. 應收帳款 - 發票表 (AR Invoices)
CREATE TABLE IF NOT EXISTS public.accounting_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_id UUID REFERENCES public.accounting_customers(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TWD',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. 發票明細表
CREATE TABLE IF NOT EXISTS public.accounting_invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.accounting_invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. 收款記錄表 (AR Payments)
CREATE TABLE IF NOT EXISTS public.accounting_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  invoice_id UUID REFERENCES public.accounting_invoices(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  reference_number TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. 應付帳款 - 帳單表 (AP Bills)
CREATE TABLE IF NOT EXISTS public.accounting_bills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  supplier_id UUID REFERENCES public.accounting_suppliers(id) ON DELETE SET NULL,
  bill_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 5,
  tax_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'TWD',
  category TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 7. 費用報銷表
CREATE TABLE IF NOT EXISTS public.accounting_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  payment_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. 銀行交易表
CREATE TABLE IF NOT EXISTS public.accounting_bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  bank_account TEXT NOT NULL DEFAULT 'main',
  transaction_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'credit',
  reference_number TEXT,
  is_reconciled BOOLEAN NOT NULL DEFAULT false,
  matched_invoice_id UUID REFERENCES public.accounting_invoices(id) ON DELETE SET NULL,
  matched_bill_id UUID REFERENCES public.accounting_bills(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 9. 會計分錄表 (Journal Entries)
CREATE TABLE IF NOT EXISTS public.accounting_journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  debit_account TEXT NOT NULL,
  credit_account TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  type TEXT NOT NULL DEFAULT 'manual',
  reference_id UUID,
  period TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =============================================
-- 啟用 RLS
-- =============================================
ALTER TABLE public.accounting_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounting_journal_entries ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS 策略 (每張表皆設 CRUD)
-- =============================================

-- accounting_customers
CREATE POLICY "Users can manage their own customers" ON public.accounting_customers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- accounting_suppliers
CREATE POLICY "Users can manage their own suppliers" ON public.accounting_suppliers FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- accounting_invoices
CREATE POLICY "Users can manage their own invoices" ON public.accounting_invoices FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- accounting_invoice_items
CREATE POLICY "Users can manage their own invoice items" ON public.accounting_invoice_items FOR ALL USING (EXISTS (SELECT 1 FROM public.accounting_invoices WHERE id = accounting_invoice_items.invoice_id AND user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.accounting_invoices WHERE id = accounting_invoice_items.invoice_id AND user_id = auth.uid()));

-- accounting_payments
CREATE POLICY "Users can manage their own payments" ON public.accounting_payments FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- accounting_bills
CREATE POLICY "Users can manage their own bills" ON public.accounting_bills FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- accounting_expenses
CREATE POLICY "Users can manage their own expenses" ON public.accounting_expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- accounting_bank_transactions
CREATE POLICY "Users can manage their own bank transactions" ON public.accounting_bank_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- accounting_journal_entries
CREATE POLICY "Users can manage their own journal entries" ON public.accounting_journal_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 索引
-- =============================================
CREATE INDEX idx_accounting_customers_user_id ON public.accounting_customers(user_id);
CREATE INDEX idx_accounting_suppliers_user_id ON public.accounting_suppliers(user_id);
CREATE INDEX idx_accounting_invoices_user_id ON public.accounting_invoices(user_id);
CREATE INDEX idx_accounting_invoices_status ON public.accounting_invoices(status);
CREATE INDEX idx_accounting_invoices_due_date ON public.accounting_invoices(due_date);
CREATE INDEX idx_accounting_invoice_items_invoice_id ON public.accounting_invoice_items(invoice_id);
CREATE INDEX idx_accounting_payments_user_id ON public.accounting_payments(user_id);
CREATE INDEX idx_accounting_payments_invoice_id ON public.accounting_payments(invoice_id);
CREATE INDEX idx_accounting_bills_user_id ON public.accounting_bills(user_id);
CREATE INDEX idx_accounting_bills_status ON public.accounting_bills(status);
CREATE INDEX idx_accounting_expenses_user_id ON public.accounting_expenses(user_id);
CREATE INDEX idx_accounting_expenses_status ON public.accounting_expenses(status);
CREATE INDEX idx_accounting_bank_transactions_user_id ON public.accounting_bank_transactions(user_id);
CREATE INDEX idx_accounting_bank_transactions_reconciled ON public.accounting_bank_transactions(is_reconciled);
CREATE INDEX idx_accounting_journal_entries_user_id ON public.accounting_journal_entries(user_id);
CREATE INDEX idx_accounting_journal_entries_period ON public.accounting_journal_entries(period);

-- =============================================
-- 自動更新 updated_at 觸發器
-- =============================================
CREATE OR REPLACE FUNCTION public.update_accounting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_accounting_customers_updated_at BEFORE UPDATE ON public.accounting_customers FOR EACH ROW EXECUTE FUNCTION public.update_accounting_updated_at();
CREATE TRIGGER update_accounting_suppliers_updated_at BEFORE UPDATE ON public.accounting_suppliers FOR EACH ROW EXECUTE FUNCTION public.update_accounting_updated_at();
CREATE TRIGGER update_accounting_invoices_updated_at BEFORE UPDATE ON public.accounting_invoices FOR EACH ROW EXECUTE FUNCTION public.update_accounting_updated_at();
CREATE TRIGGER update_accounting_bills_updated_at BEFORE UPDATE ON public.accounting_bills FOR EACH ROW EXECUTE FUNCTION public.update_accounting_updated_at();
CREATE TRIGGER update_accounting_expenses_updated_at BEFORE UPDATE ON public.accounting_expenses FOR EACH ROW EXECUTE FUNCTION public.update_accounting_updated_at();
CREATE TRIGGER update_accounting_bank_transactions_updated_at BEFORE UPDATE ON public.accounting_bank_transactions FOR EACH ROW EXECUTE FUNCTION public.update_accounting_updated_at();
