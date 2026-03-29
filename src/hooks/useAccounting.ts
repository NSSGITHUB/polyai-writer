import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type {
  Invoice, Bill, Expense, BankTransaction, JournalEntry,
  Customer, Supplier, Payment,
} from "@/types/accounting";

function useAccountingTable<T extends Record<string, unknown>>(tableName: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: result, error } = await supabase
      .from(tableName as any)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "載入失敗", description: error.message, variant: "destructive" });
    } else {
      setData((result as T[]) || []);
    }
    setLoading(false);
  }, [tableName, toast]);

  const insert = useCallback(async (record: Partial<T>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: result, error } = await supabase
      .from(tableName as any)
      .insert({ ...record, user_id: user.id } as any)
      .select()
      .single();

    if (error) {
      toast({ title: "新增失敗", description: error.message, variant: "destructive" });
      return null;
    }
    toast({ title: "新增成功" });
    await fetchData();
    return result as T;
  }, [tableName, toast, fetchData]);

  const update = useCallback(async (id: string, record: Partial<T>) => {
    const { error } = await supabase
      .from(tableName as any)
      .update(record as any)
      .eq("id", id);

    if (error) {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "更新成功" });
    await fetchData();
    return true;
  }, [tableName, toast, fetchData]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from(tableName as any)
      .delete()
      .eq("id", id);

    if (error) {
      toast({ title: "刪除失敗", description: error.message, variant: "destructive" });
      return false;
    }
    toast({ title: "已刪除" });
    await fetchData();
    return true;
  }, [tableName, toast, fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { data, loading, fetchData, insert, update, remove };
}

export function useInvoices() {
  return useAccountingTable<Invoice>("accounting_invoices");
}

export function useBills() {
  return useAccountingTable<Bill>("accounting_bills");
}

export function useExpenses() {
  return useAccountingTable<Expense>("accounting_expenses");
}

export function useBankTransactions() {
  return useAccountingTable<BankTransaction>("accounting_bank_transactions");
}

export function useJournalEntries() {
  return useAccountingTable<JournalEntry>("accounting_journal_entries");
}

export function useCustomers() {
  return useAccountingTable<Customer>("accounting_customers");
}

export function useSuppliers() {
  return useAccountingTable<Supplier>("accounting_suppliers");
}

export function usePayments() {
  return useAccountingTable<Payment>("accounting_payments");
}
