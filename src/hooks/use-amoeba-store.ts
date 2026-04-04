import { useState, useCallback, useEffect } from 'react';
import type {
  AmoebaOrganization,
  AmoebaUnit,
  AmoebaMember,
  AmoebaRevenueItem,
  AmoebaExpenseItem,
  AmoebaInternalTransaction,
  AmoebaMonthlyReport,
  AmoebaGoal,
  AmoebaBudget,
} from '@/types/amoeba';

const STORAGE_KEY = 'amoeba_data';

interface AmoebaStore {
  organization: AmoebaOrganization | null;
  units: AmoebaUnit[];
  members: AmoebaMember[];
  revenues: AmoebaRevenueItem[];
  expenses: AmoebaExpenseItem[];
  transactions: AmoebaInternalTransaction[];
  goals: AmoebaGoal[];
  budgets: AmoebaBudget[];
}

const defaultStore: AmoebaStore = {
  organization: null,
  units: [],
  members: [],
  revenues: [],
  expenses: [],
  transactions: [],
  goals: [],
  budgets: [],
};

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function loadStore(): AmoebaStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return defaultStore;
}

function saveStore(store: AmoebaStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function useAmoebaStore() {
  const [store, setStore] = useState<AmoebaStore>(loadStore);

  useEffect(() => {
    saveStore(store);
  }, [store]);

  // Organization
  const setOrganization = useCallback((org: Omit<AmoebaOrganization, 'id' | 'created_at'>) => {
    setStore(prev => ({
      ...prev,
      organization: { ...org, id: generateId(), created_at: new Date().toISOString() },
    }));
  }, []);

  const updateOrganization = useCallback((updates: Partial<AmoebaOrganization>) => {
    setStore(prev => ({
      ...prev,
      organization: prev.organization ? { ...prev.organization, ...updates } : null,
    }));
  }, []);

  // Units
  const addUnit = useCallback((unit: Omit<AmoebaUnit, 'id' | 'created_at'>) => {
    const newUnit: AmoebaUnit = { ...unit, id: generateId(), created_at: new Date().toISOString() };
    setStore(prev => ({ ...prev, units: [...prev.units, newUnit] }));
    return newUnit;
  }, []);

  const updateUnit = useCallback((id: string, updates: Partial<AmoebaUnit>) => {
    setStore(prev => ({
      ...prev,
      units: prev.units.map(u => u.id === id ? { ...u, ...updates } : u),
    }));
  }, []);

  const deleteUnit = useCallback((id: string) => {
    setStore(prev => ({
      ...prev,
      units: prev.units.filter(u => u.id !== id),
      members: prev.members.filter(m => m.unit_id !== id),
      revenues: prev.revenues.filter(r => r.unit_id !== id),
      expenses: prev.expenses.filter(e => e.unit_id !== id),
    }));
  }, []);

  // Members
  const addMember = useCallback((member: Omit<AmoebaMember, 'id'>) => {
    const newMember: AmoebaMember = { ...member, id: generateId() };
    setStore(prev => ({ ...prev, members: [...prev.members, newMember] }));
    return newMember;
  }, []);

  const updateMember = useCallback((id: string, updates: Partial<AmoebaMember>) => {
    setStore(prev => ({
      ...prev,
      members: prev.members.map(m => m.id === id ? { ...m, ...updates } : m),
    }));
  }, []);

  const deleteMember = useCallback((id: string) => {
    setStore(prev => ({
      ...prev,
      members: prev.members.filter(m => m.id !== id),
    }));
  }, []);

  // Revenue
  const addRevenue = useCallback((item: Omit<AmoebaRevenueItem, 'id' | 'created_at'>) => {
    const newItem: AmoebaRevenueItem = { ...item, id: generateId(), created_at: new Date().toISOString() };
    setStore(prev => ({ ...prev, revenues: [...prev.revenues, newItem] }));
    return newItem;
  }, []);

  const updateRevenue = useCallback((id: string, updates: Partial<AmoebaRevenueItem>) => {
    setStore(prev => ({
      ...prev,
      revenues: prev.revenues.map(r => r.id === id ? { ...r, ...updates } : r),
    }));
  }, []);

  const deleteRevenue = useCallback((id: string) => {
    setStore(prev => ({
      ...prev,
      revenues: prev.revenues.filter(r => r.id !== id),
    }));
  }, []);

  // Expense
  const addExpense = useCallback((item: Omit<AmoebaExpenseItem, 'id' | 'created_at'>) => {
    const newItem: AmoebaExpenseItem = { ...item, id: generateId(), created_at: new Date().toISOString() };
    setStore(prev => ({ ...prev, expenses: [...prev.expenses, newItem] }));
    return newItem;
  }, []);

  const updateExpense = useCallback((id: string, updates: Partial<AmoebaExpenseItem>) => {
    setStore(prev => ({
      ...prev,
      expenses: prev.expenses.map(e => e.id === id ? { ...e, ...updates } : e),
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setStore(prev => ({
      ...prev,
      expenses: prev.expenses.filter(e => e.id !== id),
    }));
  }, []);

  // Internal Transactions
  const addTransaction = useCallback((tx: Omit<AmoebaInternalTransaction, 'id' | 'created_at'>) => {
    const newTx: AmoebaInternalTransaction = { ...tx, id: generateId(), created_at: new Date().toISOString() };
    setStore(prev => ({ ...prev, transactions: [...prev.transactions, newTx] }));
    return newTx;
  }, []);

  const updateTransaction = useCallback((id: string, updates: Partial<AmoebaInternalTransaction>) => {
    setStore(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setStore(prev => ({
      ...prev,
      transactions: prev.transactions.filter(t => t.id !== id),
    }));
  }, []);

  // Calculate monthly report for a unit
  const getMonthlyReport = useCallback((unitId: string, period: string): AmoebaMonthlyReport | null => {
    const unit = store.units.find(u => u.id === unitId);
    if (!unit) return null;

    const unitMembers = store.members.filter(m => m.unit_id === unitId && m.is_active);
    const unitRevenues = store.revenues.filter(r => r.unit_id === unitId && r.period === period);
    const unitExpenses = store.expenses.filter(e => e.unit_id === unitId && e.period === period);

    const externalRevenue = unitRevenues.filter(r => r.source === 'external').reduce((s, r) => s + r.amount, 0);
    const internalRevenue = unitRevenues.filter(r => r.source === 'internal').reduce((s, r) => s + r.amount, 0);
    const totalRevenue = externalRevenue + internalRevenue;

    const laborCost = unitExpenses.filter(e => e.is_labor_cost).reduce((s, e) => s + e.amount, 0);
    const nonLaborCost = unitExpenses.filter(e => !e.is_labor_cost).reduce((s, e) => s + e.amount, 0);
    const totalExpense = laborCost + nonLaborCost;

    const grossProfit = totalRevenue - nonLaborCost; // 附加價值（不含人事費用）
    const totalLaborHours = unitMembers.reduce((s, m) => s + m.monthly_hours, 0);
    const hourlyEfficiency = totalLaborHours > 0 ? grossProfit / totalLaborHours : 0;
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpense) / totalRevenue) * 100 : 0;

    return {
      unit_id: unitId,
      unit_name: unit.name,
      unit_code: unit.code,
      period,
      total_revenue: totalRevenue,
      external_revenue: externalRevenue,
      internal_revenue: internalRevenue,
      total_expense: totalExpense,
      labor_cost: laborCost,
      non_labor_cost: nonLaborCost,
      gross_profit: grossProfit,
      total_labor_hours: totalLaborHours,
      hourly_efficiency: hourlyEfficiency,
      member_count: unitMembers.length,
      profit_margin: profitMargin,
    };
  }, [store]);

  // Get all reports for a period
  const getAllReports = useCallback((period: string): AmoebaMonthlyReport[] => {
    return store.units
      .filter(u => u.is_active)
      .map(u => getMonthlyReport(u.id, period))
      .filter((r): r is AmoebaMonthlyReport => r !== null);
  }, [store, getMonthlyReport]);

  // Goals
  const addGoal = useCallback((goal: Omit<AmoebaGoal, 'id' | 'created_at'>) => {
    const newGoal: AmoebaGoal = { ...goal, id: generateId(), created_at: new Date().toISOString() };
    setStore(prev => ({ ...prev, goals: [...prev.goals, newGoal] }));
    return newGoal;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<AmoebaGoal>) => {
    setStore(prev => ({
      ...prev,
      goals: prev.goals.map(g => g.id === id ? { ...g, ...updates } : g),
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setStore(prev => ({ ...prev, goals: prev.goals.filter(g => g.id !== id) }));
  }, []);

  // Budgets
  const addBudget = useCallback((budget: Omit<AmoebaBudget, 'id' | 'created_at'>) => {
    const newBudget: AmoebaBudget = { ...budget, id: generateId(), created_at: new Date().toISOString() };
    setStore(prev => ({ ...prev, budgets: [...prev.budgets, newBudget] }));
    return newBudget;
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<AmoebaBudget>) => {
    setStore(prev => ({
      ...prev,
      budgets: prev.budgets.map(b => b.id === id ? { ...b, ...updates } : b),
    }));
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setStore(prev => ({ ...prev, budgets: prev.budgets.filter(b => b.id !== id) }));
  }, []);

  // Reset all data
  const resetStore = useCallback(() => {
    setStore(defaultStore);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    ...store,
    setOrganization,
    updateOrganization,
    addUnit,
    updateUnit,
    deleteUnit,
    addMember,
    updateMember,
    deleteMember,
    addRevenue,
    updateRevenue,
    deleteRevenue,
    addExpense,
    updateExpense,
    deleteExpense,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addGoal,
    updateGoal,
    deleteGoal,
    addBudget,
    updateBudget,
    deleteBudget,
    getMonthlyReport,
    getAllReports,
    resetStore,
  };
}
