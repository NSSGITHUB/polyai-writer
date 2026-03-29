export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  tax_id: string | null;
  payment_terms: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  user_id: string;
  customer_id: string | null;
  invoice_number: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  currency: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  invoice_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: string;
  reference_number: string | null;
  notes: string | null;
  created_at: string;
}

export interface Bill {
  id: string;
  user_id: string;
  supplier_id: string | null;
  bill_number: string;
  status: "pending" | "approved" | "paid" | "overdue" | "cancelled";
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  currency: string;
  category: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  supplier?: Supplier;
}

export interface Expense {
  id: string;
  user_id: string;
  employee_name: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  receipt_url: string | null;
  status: "pending" | "approved" | "rejected" | "paid";
  approved_by: string | null;
  approved_at: string | null;
  payment_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BankTransaction {
  id: string;
  user_id: string;
  bank_account: string;
  transaction_date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  reference_number: string | null;
  is_reconciled: boolean;
  matched_invoice_id: string | null;
  matched_bill_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  debit_account: string;
  credit_account: string;
  amount: number;
  type: "manual" | "auto";
  reference_id: string | null;
  period: string | null;
  created_at: string;
}

export const EXPENSE_CATEGORIES = [
  "交通費", "餐費", "住宿費", "辦公用品", "通訊費",
  "差旅費", "培訓費", "招待費", "其他",
] as const;

export const BILL_CATEGORIES = [
  "辦公租金", "水電費", "網路費", "軟體訂閱", "設備採購",
  "行銷費用", "法律顧問", "會計服務", "保險費", "其他",
] as const;

export const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "銀行轉帳" },
  { value: "cash", label: "現金" },
  { value: "credit_card", label: "信用卡" },
  { value: "check", label: "支票" },
  { value: "other", label: "其他" },
] as const;

export const ACCOUNT_OPTIONS = [
  "1100 現金", "1200 銀行存款", "1300 應收帳款", "1400 預付款項",
  "1500 存貨", "1600 固定資產", "2100 應付帳款", "2200 預收款項",
  "2300 應付薪資", "2400 應付稅款", "3100 股本", "3200 保留盈餘",
  "4100 營業收入", "4200 其他收入", "5100 營業成本",
  "6100 薪資費用", "6200 租金費用", "6300 水電費", "6400 折舊費用",
  "6500 行銷費用", "6600 管理費用", "6700 利息費用",
] as const;
