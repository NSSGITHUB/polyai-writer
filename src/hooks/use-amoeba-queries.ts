/**
 * 阿米巴經營管理系統 - React Query Hooks
 *
 * 提供 Supabase 後端的查詢/變更 hooks，含快取、自動重新載入、樂觀更新。
 * 所有頁面透過此 hooks 層操作資料。
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useCallback } from 'react';
import * as api from '@/lib/amoeba-supabase';
import { supabase } from '@/integrations/supabase/client';
import type {
  AmoebaOrganization,
  AmoebaUnit,
  AmoebaMember,
  AmoebaRevenueItem,
  AmoebaExpenseItem,
  AmoebaInternalTransaction,
  AmoebaGoal,
  AmoebaBudget,
  AmoebaBonusRule,
  AmoebaMonthlyReport,
  AmoebaBonusResult,
  AmoebaUnitBonusSummary,
  AmoebaRole,
  AmoebaUserContext,
  BonusCalcMethod,
} from '@/types/amoeba';

// ============================================================
// Current user & org context
// ============================================================

const ORG_KEY = 'amoeba_current_org';

function getCurrentOrgId(): string | null {
  return localStorage.getItem(ORG_KEY);
}

function setCurrentOrgId(orgId: string | null) {
  if (orgId) localStorage.setItem(ORG_KEY, orgId);
  else localStorage.removeItem(ORG_KEY);
}

// ============================================================
// Main Hook
// ============================================================

export function useAmoebaData() {
  const qc = useQueryClient();

  // --- Auth user ---
  const userInfo = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) {
        const u = JSON.parse(raw);
        return { id: u.id || u.email, name: u.name || u.email, email: u.email };
      }
    } catch { /* */ }
    return null;
  }, []);

  // --- Organizations ---
  const orgsQuery = useQuery({
    queryKey: ['amoeba', 'orgs'],
    queryFn: api.fetchOrganizations,
    enabled: !!userInfo,
  });

  const allOrganizations = orgsQuery.data || [];
  const currentOrgId = getCurrentOrgId();
  const currentOrg = allOrganizations.find((o) => o.org.id === currentOrgId);
  const organization = currentOrg?.org || null;
  const userRole = (currentOrg?.role || null) as AmoebaRole | null;

  const userContext: AmoebaUserContext = {
    userId: userInfo?.id || '',
    userName: userInfo?.name || '',
    userEmail: userInfo?.email || '',
    currentOrgId,
    role: userRole,
  };

  const canEdit = userRole === 'owner' || userRole === 'admin' || userRole === 'manager';
  const canAdmin = userRole === 'owner' || userRole === 'admin';
  const isOwner = userRole === 'owner';

  const switchOrganization = useCallback((orgId: string) => {
    setCurrentOrgId(orgId);
    qc.invalidateQueries({ queryKey: ['amoeba'] });
  }, [qc]);

  // Auto-select first org if none selected
  useEffect(() => {
    if (!currentOrgId && allOrganizations.length > 0) {
      switchOrganization(allOrganizations[0].org.id);
    }
  }, [currentOrgId, allOrganizations, switchOrganization]);

  // --- Units ---
  const unitsQuery = useQuery({
    queryKey: ['amoeba', 'units', currentOrgId],
    queryFn: () => api.fetchUnits(currentOrgId!),
    enabled: !!currentOrgId,
  });
  const units: AmoebaUnit[] = unitsQuery.data || [];
  const unitIds = units.map((u) => u.id);

  // --- Members ---
  const membersQuery = useQuery({
    queryKey: ['amoeba', 'members', currentOrgId],
    queryFn: () => api.fetchMembers(unitIds),
    enabled: unitIds.length > 0,
  });
  const members: AmoebaMember[] = membersQuery.data || [];

  // --- Revenues ---
  const revenuesQuery = useQuery({
    queryKey: ['amoeba', 'revenues', currentOrgId],
    queryFn: () => api.fetchRevenues(unitIds),
    enabled: unitIds.length > 0,
  });
  const revenues: AmoebaRevenueItem[] = revenuesQuery.data || [];

  // --- Expenses ---
  const expensesQuery = useQuery({
    queryKey: ['amoeba', 'expenses', currentOrgId],
    queryFn: () => api.fetchExpenses(unitIds),
    enabled: unitIds.length > 0,
  });
  const expenses: AmoebaExpenseItem[] = expensesQuery.data || [];

  // --- Transactions ---
  const transactionsQuery = useQuery({
    queryKey: ['amoeba', 'transactions', currentOrgId],
    queryFn: () => api.fetchTransactions(unitIds),
    enabled: unitIds.length > 0,
  });
  const transactions: AmoebaInternalTransaction[] = transactionsQuery.data || [];

  // --- Goals ---
  const goalsQuery = useQuery({
    queryKey: ['amoeba', 'goals', currentOrgId],
    queryFn: () => api.fetchGoals(unitIds),
    enabled: unitIds.length > 0,
  });
  const goals: AmoebaGoal[] = goalsQuery.data || [];

  // --- Budgets ---
  const budgetsQuery = useQuery({
    queryKey: ['amoeba', 'budgets', currentOrgId],
    queryFn: () => api.fetchBudgets(unitIds),
    enabled: unitIds.length > 0,
  });
  const budgets: AmoebaBudget[] = budgetsQuery.data || [];

  // --- Bonus Rules ---
  const bonusQuery = useQuery({
    queryKey: ['amoeba', 'bonusRules', currentOrgId],
    queryFn: () => api.fetchBonusRules(currentOrgId!),
    enabled: !!currentOrgId,
  });
  const bonusRules: AmoebaBonusRule[] = bonusQuery.data || [];

  // --- Collaborators ---
  const collabQuery = useQuery({
    queryKey: ['amoeba', 'collaborators', currentOrgId],
    queryFn: () => api.fetchCollaborators(currentOrgId!),
    enabled: !!currentOrgId,
  });
  const collaborators = collabQuery.data || [];

  // --- Activity Log ---
  const activityQuery = useQuery({
    queryKey: ['amoeba', 'activity', currentOrgId],
    queryFn: () => api.fetchActivityLog(currentOrgId!, 500),
    enabled: !!currentOrgId,
  });
  const activityLog = activityQuery.data || [];

  // --- Real-time sync ---
  useEffect(() => {
    if (!currentOrgId) return;
    const unsub = api.subscribeToOrgChanges(
      currentOrgId,
      [
        'amoeba_units', 'amoeba_members', 'amoeba_revenue_items',
        'amoeba_expense_items', 'amoeba_internal_transactions',
        'amoeba_goals', 'amoeba_budgets', 'amoeba_bonus_rules',
        'amoeba_collaborators', 'amoeba_activity_logs',
      ],
      () => {
        qc.invalidateQueries({ queryKey: ['amoeba'] });
      }
    );
    return unsub;
  }, [currentOrgId, qc]);

  // ============================================================
  // Activity logging helper
  // ============================================================

  const logActivity = useCallback(
    async (action: string, targetType: string, targetName: string, details?: string) => {
      if (!currentOrgId || !userInfo) return;
      await api.insertActivityLog({
        organization_id: currentOrgId,
        user_id: userInfo.id,
        user_name: userInfo.name,
        action,
        target_type: targetType,
        target_name: targetName,
        details,
      });
      qc.invalidateQueries({ queryKey: ['amoeba', 'activity'] });
    },
    [currentOrgId, userInfo, qc]
  );

  // ============================================================
  // Mutation factories
  // ============================================================

  function invalidateAll() {
    qc.invalidateQueries({ queryKey: ['amoeba'] });
  }

  // Organization mutations
  const createOrganization = useMutation({
    mutationFn: api.createOrganization,
    onSuccess: () => { invalidateAll(); },
  });

  const updateOrganization = useMutation({
    mutationFn: (args: { id: string; updates: Partial<AmoebaOrganization> }) =>
      api.updateOrganization(args.id, args.updates),
    onSuccess: () => { invalidateAll(); },
  });

  const deleteOrganization = useMutation({
    mutationFn: api.deleteOrganization,
    onSuccess: () => {
      setCurrentOrgId(null);
      invalidateAll();
    },
  });

  // Unit mutations
  const addUnit = useMutation({
    mutationFn: api.createUnit,
    onSuccess: (_, vars) => {
      logActivity('新增單位', 'unit', vars.name);
      invalidateAll();
    },
  });

  const updateUnit = useMutation({
    mutationFn: (args: { id: string; updates: Partial<AmoebaUnit> }) =>
      api.updateUnit(args.id, args.updates),
    onSuccess: () => invalidateAll(),
  });

  const deleteUnit = useMutation({
    mutationFn: api.deleteUnit,
    onSuccess: () => invalidateAll(),
  });

  // Member mutations
  const addMember = useMutation({
    mutationFn: api.createMember,
    onSuccess: (_, vars) => {
      logActivity('新增成員', 'member', vars.name);
      invalidateAll();
    },
  });

  const updateMember = useMutation({
    mutationFn: (args: { id: string; updates: Partial<AmoebaMember> }) =>
      api.updateMember(args.id, args.updates),
    onSuccess: () => invalidateAll(),
  });

  const deleteMember = useMutation({
    mutationFn: api.deleteMember,
    onSuccess: () => invalidateAll(),
  });

  // Revenue mutations
  const addRevenue = useMutation({
    mutationFn: api.createRevenue,
    onSuccess: (_, vars) => {
      logActivity('新增營收', 'revenue', `$${vars.amount.toLocaleString()}`, vars.category);
      invalidateAll();
    },
  });

  const updateRevenue = useMutation({
    mutationFn: (args: { id: string; updates: Partial<AmoebaRevenueItem> }) =>
      api.updateRevenue(args.id, args.updates),
    onSuccess: () => invalidateAll(),
  });

  const deleteRevenue = useMutation({
    mutationFn: api.deleteRevenue,
    onSuccess: () => invalidateAll(),
  });

  // Expense mutations
  const addExpense = useMutation({
    mutationFn: api.createExpense,
    onSuccess: (_, vars) => {
      logActivity('新增費用', 'expense', `$${vars.amount.toLocaleString()}`, vars.category);
      invalidateAll();
    },
  });

  const updateExpense = useMutation({
    mutationFn: (args: { id: string; updates: Partial<AmoebaExpenseItem> }) =>
      api.updateExpense(args.id, args.updates),
    onSuccess: () => invalidateAll(),
  });

  const deleteExpense = useMutation({
    mutationFn: api.deleteExpense,
    onSuccess: () => invalidateAll(),
  });

  // Transaction mutations
  const addTransaction = useMutation({
    mutationFn: api.createTransaction,
    onSuccess: (_, vars) => {
      logActivity('新增內部交易', 'transaction', `$${vars.amount.toLocaleString()}`);
      invalidateAll();
    },
  });

  const updateTransaction = useMutation({
    mutationFn: (args: { id: string; updates: Partial<AmoebaInternalTransaction> }) =>
      api.updateTransaction(args.id, args.updates),
    onSuccess: () => invalidateAll(),
  });

  const deleteTransaction = useMutation({
    mutationFn: api.deleteTransaction,
    onSuccess: () => invalidateAll(),
  });

  // Goal mutations
  const addGoal = useMutation({
    mutationFn: api.createGoal,
    onSuccess: () => invalidateAll(),
  });

  const updateGoal = useMutation({
    mutationFn: (args: { id: string; updates: Partial<AmoebaGoal> }) =>
      api.updateGoal(args.id, args.updates),
    onSuccess: () => invalidateAll(),
  });

  const deleteGoal = useMutation({
    mutationFn: api.deleteGoal,
    onSuccess: () => invalidateAll(),
  });

  // Budget mutations
  const addBudget = useMutation({
    mutationFn: api.createBudget,
    onSuccess: () => invalidateAll(),
  });

  const updateBudget = useMutation({
    mutationFn: (args: { id: string; updates: Partial<AmoebaBudget> }) =>
      api.updateBudget(args.id, args.updates),
    onSuccess: () => invalidateAll(),
  });

  const deleteBudget = useMutation({
    mutationFn: api.deleteBudget,
    onSuccess: () => invalidateAll(),
  });

  // Bonus rule mutations
  const addBonusRule = useMutation({
    mutationFn: api.createBonusRule,
    onSuccess: () => invalidateAll(),
  });

  const updateBonusRule = useMutation({
    mutationFn: (args: { id: string; updates: Record<string, any> }) =>
      api.updateBonusRule(args.id, args.updates),
    onSuccess: () => invalidateAll(),
  });

  const deleteBonusRule = useMutation({
    mutationFn: api.deleteBonusRule,
    onSuccess: () => invalidateAll(),
  });

  // Collaborator mutations
  const addCollaborator = useMutation({
    mutationFn: api.addCollaborator,
    onSuccess: (_, vars) => {
      logActivity('邀請協作者', 'collaborator', vars.user_name, `角色：${vars.role}`);
      invalidateAll();
    },
  });

  const updateCollaboratorRole = useMutation({
    mutationFn: (args: { id: string; role: string }) =>
      api.updateCollaboratorRole(args.id, args.role),
    onSuccess: () => invalidateAll(),
  });

  const removeCollaborator = useMutation({
    mutationFn: api.removeCollaborator,
    onSuccess: () => invalidateAll(),
  });

  // ============================================================
  // Report calculation (client-side, same as before)
  // ============================================================

  const getMonthlyReport = useCallback(
    (unitId: string, period: string): AmoebaMonthlyReport | null => {
      const unit = units.find((u) => u.id === unitId);
      if (!unit) return null;

      const unitMembers = members.filter((m) => m.unit_id === unitId && m.is_active);
      const unitRevenues = revenues.filter((r) => r.unit_id === unitId && r.period === period);
      const unitExpenses = expenses.filter((e) => e.unit_id === unitId && e.period === period);

      const externalRevenue = unitRevenues.filter((r) => r.source === 'external').reduce((s, r) => s + Number(r.amount), 0);
      const internalRevenue = unitRevenues.filter((r) => r.source === 'internal').reduce((s, r) => s + Number(r.amount), 0);
      const totalRevenue = externalRevenue + internalRevenue;
      const laborCost = unitExpenses.filter((e) => e.is_labor_cost).reduce((s, e) => s + Number(e.amount), 0);
      const nonLaborCost = unitExpenses.filter((e) => !e.is_labor_cost).reduce((s, e) => s + Number(e.amount), 0);
      const totalExpense = laborCost + nonLaborCost;
      const grossProfit = totalRevenue - nonLaborCost;
      const totalLaborHours = unitMembers.reduce((s, m) => s + Number(m.monthly_hours), 0);
      const hourlyEfficiency = totalLaborHours > 0 ? grossProfit / totalLaborHours : 0;
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpense) / totalRevenue) * 100 : 0;

      return {
        unit_id: unitId, unit_name: unit.name, unit_code: unit.code, period,
        total_revenue: totalRevenue, external_revenue: externalRevenue, internal_revenue: internalRevenue,
        total_expense: totalExpense, labor_cost: laborCost, non_labor_cost: nonLaborCost,
        gross_profit: grossProfit, total_labor_hours: totalLaborHours,
        hourly_efficiency: hourlyEfficiency, member_count: unitMembers.length, profit_margin: profitMargin,
      };
    },
    [units, members, revenues, expenses]
  );

  const getAllReports = useCallback(
    (period: string): AmoebaMonthlyReport[] =>
      units
        .filter((u) => u.is_active)
        .map((u) => getMonthlyReport(u.id, period))
        .filter((r): r is AmoebaMonthlyReport => r !== null),
    [units, getMonthlyReport]
  );

  // Bonus calculation (same engine as localStorage version)
  const calculateBonus = useCallback(
    (period: string, ruleId?: string) => {
      const rule = ruleId
        ? bonusRules.find((r) => r.id === ruleId)
        : bonusRules.find((r) => r.is_active);
      if (!rule) return { results: [] as AmoebaBonusResult[], summaries: [] as AmoebaUnitBonusSummary[] };

      const reports = getAllReports(period);
      const totalGrossProfit = reports.reduce((s, r) => s + Math.max(0, r.gross_profit), 0);
      const results: AmoebaBonusResult[] = [];
      const summaryMap = new Map<string, AmoebaUnitBonusSummary>();

      for (const report of reports) {
        const unitMembers = members.filter((m) => m.unit_id === report.unit_id && m.is_active);
        const unitTotalHours = unitMembers.reduce((s, m) => s + Number(m.monthly_hours), 0);
        let unitTotalBonus = 0;

        for (const member of unitMembers) {
          const baseSalary = Number(member.hourly_rate) * Number(member.monthly_hours);
          const hourRatio = unitTotalHours > 0 ? Number(member.monthly_hours) / unitTotalHours : 0;
          let bonusAmount = 0;
          let calcDetail = '';

          switch (rule.method as BonusCalcMethod) {
            case 'profit_ratio': {
              const unitBonus = Math.max(0, report.gross_profit) * (Number(rule.profit_share_percent) / 100);
              bonusAmount = unitBonus * hourRatio;
              calcDetail = `附加價值 $${report.gross_profit.toLocaleString()} × ${rule.profit_share_percent}% × 工時佔比 ${(hourRatio * 100).toFixed(1)}%`;
              break;
            }
            case 'efficiency_tier': {
              const eff = report.hourly_efficiency;
              const tiers = (rule.efficiency_tiers || []) as any[];
              const tier = tiers.find((t: any) => eff >= t.min_efficiency && (t.max_efficiency === 0 || eff < t.max_efficiency));
              if (tier) {
                bonusAmount = baseSalary * tier.multiplier;
                calcDetail = `效率 $${Math.round(eff)}/hr → ${tier.label}，月薪 × ${tier.multiplier}`;
              }
              break;
            }
            case 'goal_achievement': {
              const goal = goals.find((g) => g.unit_id === report.unit_id && g.period === period);
              if (goal && Number(goal.target_profit) > 0) {
                const rate = (report.gross_profit / Number(goal.target_profit)) * 100;
                if (rate >= Number(rule.achievement_min_threshold)) {
                  let pct = Number(rule.achievement_base_percent);
                  if (rate > 100) pct += (rate - 100) * Number(rule.achievement_exceed_bonus);
                  else pct *= rate / 100;
                  bonusAmount = baseSalary * (pct / 100);
                  calcDetail = `達成 ${rate.toFixed(0)}%，獎金比 ${pct.toFixed(1)}%`;
                }
              }
              break;
            }
            case 'fixed_pool_split': {
              const share = totalGrossProfit > 0 ? Math.max(0, report.gross_profit) / totalGrossProfit : 0;
              bonusAmount = Number(rule.fixed_pool_amount) * share * hourRatio;
              calcDetail = `池 $${Number(rule.fixed_pool_amount).toLocaleString()} × 佔比 ${(share * 100).toFixed(1)}% × 工時 ${(hourRatio * 100).toFixed(1)}%`;
              break;
            }
          }

          bonusAmount = Math.round(Math.max(0, bonusAmount));
          unitTotalBonus += bonusAmount;
          results.push({
            member_id: member.id, member_name: member.name, member_role: member.role,
            unit_id: report.unit_id, unit_name: report.unit_name, unit_code: report.unit_code,
            period, base_salary: baseSalary, monthly_hours: Number(member.monthly_hours),
            bonus_amount: bonusAmount, bonus_ratio: baseSalary > 0 ? (bonusAmount / baseSalary) * 100 : 0,
            calc_method: rule.method as BonusCalcMethod, calc_detail: calcDetail,
          });
        }

        summaryMap.set(report.unit_id, {
          unit_id: report.unit_id, unit_name: report.unit_name, unit_code: report.unit_code,
          period, total_bonus: unitTotalBonus, member_count: unitMembers.length,
          avg_bonus: unitMembers.length > 0 ? Math.round(unitTotalBonus / unitMembers.length) : 0,
          profit_contribution: report.gross_profit, efficiency: report.hourly_efficiency,
        });
      }
      return { results, summaries: Array.from(summaryMap.values()) };
    },
    [bonusRules, goals, members, getAllReports]
  );

  // ============================================================
  // Loading state
  // ============================================================

  const isLoading = orgsQuery.isLoading || unitsQuery.isLoading || membersQuery.isLoading;

  // ============================================================
  // Return (same interface as localStorage store for compatibility)
  // ============================================================

  return {
    // State
    isLoading,
    userContext,
    canEdit,
    canAdmin,
    isOwner,

    // Multi-org
    allOrganizations: allOrganizations.map(({ org, role }) => ({ org, role: role as AmoebaRole })),
    switchOrganization,
    createOrganization: createOrganization.mutateAsync,
    deleteOrganization: deleteOrganization.mutateAsync,

    // Organization
    organization,
    setOrganization: (data: any) => createOrganization.mutateAsync(data),
    updateOrganization: (updates: Partial<AmoebaOrganization>) =>
      currentOrgId ? updateOrganization.mutateAsync({ id: currentOrgId, updates }) : Promise.resolve(),

    // Units
    units,
    addUnit: (data: Omit<AmoebaUnit, 'id' | 'created_at'>) => addUnit.mutateAsync(data),
    updateUnit: (id: string, updates: Partial<AmoebaUnit>) => updateUnit.mutateAsync({ id, updates }),
    deleteUnit: (id: string) => deleteUnit.mutateAsync(id),

    // Members
    members,
    addMember: (data: Omit<AmoebaMember, 'id'>) => addMember.mutateAsync(data),
    updateMember: (id: string, updates: Partial<AmoebaMember>) => updateMember.mutateAsync({ id, updates }),
    deleteMember: (id: string) => deleteMember.mutateAsync(id),

    // Revenue
    revenues,
    addRevenue: (data: Omit<AmoebaRevenueItem, 'id' | 'created_at'>) => addRevenue.mutateAsync(data),
    updateRevenue: (id: string, updates: Partial<AmoebaRevenueItem>) => updateRevenue.mutateAsync({ id, updates }),
    deleteRevenue: (id: string) => deleteRevenue.mutateAsync(id),

    // Expense
    expenses,
    addExpense: (data: Omit<AmoebaExpenseItem, 'id' | 'created_at'>) => addExpense.mutateAsync(data),
    updateExpense: (id: string, updates: Partial<AmoebaExpenseItem>) => updateExpense.mutateAsync({ id, updates }),
    deleteExpense: (id: string) => deleteExpense.mutateAsync(id),

    // Transactions
    transactions,
    addTransaction: (data: Omit<AmoebaInternalTransaction, 'id' | 'created_at'>) => addTransaction.mutateAsync(data),
    updateTransaction: (id: string, updates: Partial<AmoebaInternalTransaction>) => updateTransaction.mutateAsync({ id, updates }),
    deleteTransaction: (id: string) => deleteTransaction.mutateAsync(id),

    // Goals
    goals,
    addGoal: (data: Omit<AmoebaGoal, 'id' | 'created_at'>) => addGoal.mutateAsync(data),
    updateGoal: (id: string, updates: Partial<AmoebaGoal>) => updateGoal.mutateAsync({ id, updates }),
    deleteGoal: (id: string) => deleteGoal.mutateAsync(id),

    // Budgets
    budgets,
    addBudget: (data: Omit<AmoebaBudget, 'id' | 'created_at'>) => addBudget.mutateAsync(data),
    updateBudget: (id: string, updates: Partial<AmoebaBudget>) => updateBudget.mutateAsync({ id, updates }),
    deleteBudget: (id: string) => deleteBudget.mutateAsync(id),

    // Bonus
    bonusRules,
    addBonusRule: (data: any) => addBonusRule.mutateAsync({ ...data, organization_id: currentOrgId }),
    updateBonusRule: (id: string, updates: any) => updateBonusRule.mutateAsync({ id, updates }),
    deleteBonusRule: (id: string) => deleteBonusRule.mutateAsync(id),
    calculateBonus,

    // Collaborators
    collaborators,
    addCollaborator: (email: string, name: string, role: AmoebaRole) =>
      addCollaborator.mutateAsync({
        organization_id: currentOrgId!,
        user_id: email,
        user_email: email,
        user_name: name,
        role,
        invited_by: userInfo?.id || '',
      }),
    updateCollaboratorRole: (id: string, role: AmoebaRole) =>
      updateCollaboratorRole.mutateAsync({ id, role }),
    removeCollaborator: (id: string) => removeCollaborator.mutateAsync(id),

    // Activity
    activityLog,

    // Reports
    getMonthlyReport,
    getAllReports,

    // Reset
    resetStore: () => currentOrgId ? deleteOrganization.mutateAsync(currentOrgId) : Promise.resolve(),
  };
}
