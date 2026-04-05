import { useState, useCallback, useEffect, useMemo } from 'react';
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
  AmoebaCollaborator,
  AmoebaActivityLog,
  AmoebaRole,
  AmoebaUserContext,
} from '@/types/amoeba';

// ============================================================
// Storage: per-user, multi-organization
// ============================================================

const STORAGE_PREFIX = 'amoeba_v2_';

interface OrgData {
  organization: AmoebaOrganization;
  units: AmoebaUnit[];
  members: AmoebaMember[];
  revenues: AmoebaRevenueItem[];
  expenses: AmoebaExpenseItem[];
  transactions: AmoebaInternalTransaction[];
  goals: AmoebaGoal[];
  budgets: AmoebaBudget[];
  collaborators: AmoebaCollaborator[];
  activityLog: AmoebaActivityLog[];
}

interface UserIndex {
  ownedOrgIds: string[];
  sharedOrgIds: string[];
  currentOrgId: string | null;
}

const defaultOrgData: OrgData = {
  organization: null as unknown as AmoebaOrganization,
  units: [],
  members: [],
  revenues: [],
  expenses: [],
  transactions: [],
  goals: [],
  budgets: [],
  collaborators: [],
  activityLog: [],
};

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getUserId(): { id: string; name: string; email: string } | null {
  try {
    const raw = localStorage.getItem('user');
    if (raw) {
      const user = JSON.parse(raw);
      return { id: user.id || user.email, name: user.name || user.email, email: user.email };
    }
  } catch { /* ignore */ }
  return null;
}

function getUserIndex(userId: string): UserIndex {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}index_${userId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { ownedOrgIds: [], sharedOrgIds: [], currentOrgId: null };
}

function saveUserIndex(userId: string, index: UserIndex) {
  localStorage.setItem(`${STORAGE_PREFIX}index_${userId}`, JSON.stringify(index));
}

function loadOrgData(orgId: string): OrgData | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}org_${orgId}`);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveOrgData(orgId: string, data: OrgData) {
  localStorage.setItem(`${STORAGE_PREFIX}org_${orgId}`, JSON.stringify(data));
}

function deleteOrgData(orgId: string) {
  localStorage.removeItem(`${STORAGE_PREFIX}org_${orgId}`);
}

// Migrate from v1 single-store to v2 per-user
function migrateV1(userId: string) {
  const v1 = localStorage.getItem('amoeba_data');
  if (!v1) return;
  try {
    const old = JSON.parse(v1);
    if (old.organization) {
      const orgId = old.organization.id || generateId();
      old.organization.owner_id = userId;
      old.organization.id = orgId;
      const orgData: OrgData = {
        organization: old.organization,
        units: old.units || [],
        members: old.members || [],
        revenues: old.revenues || [],
        expenses: old.expenses || [],
        transactions: old.transactions || [],
        goals: old.goals || [],
        budgets: old.budgets || [],
        collaborators: [],
        activityLog: [],
      };
      saveOrgData(orgId, orgData);
      const idx = getUserIndex(userId);
      if (!idx.ownedOrgIds.includes(orgId)) {
        idx.ownedOrgIds.push(orgId);
      }
      idx.currentOrgId = orgId;
      saveUserIndex(userId, idx);
    }
    localStorage.removeItem('amoeba_data');
  } catch { /* ignore */ }
}

// ============================================================
// Hook
// ============================================================

export function useAmoebaStore() {
  const userInfo = useMemo(() => getUserId(), []);
  const userId = userInfo?.id || '';

  // Run migration once
  useEffect(() => {
    if (userId) migrateV1(userId);
  }, [userId]);

  const [userIndex, setUserIndex] = useState<UserIndex>(() =>
    userId ? getUserIndex(userId) : { ownedOrgIds: [], sharedOrgIds: [], currentOrgId: null }
  );

  const [orgData, setOrgData] = useState<OrgData | null>(() =>
    userIndex.currentOrgId ? loadOrgData(userIndex.currentOrgId) : null
  );

  // Persist
  useEffect(() => {
    if (userId) saveUserIndex(userId, userIndex);
  }, [userId, userIndex]);

  useEffect(() => {
    if (userIndex.currentOrgId && orgData) {
      saveOrgData(userIndex.currentOrgId, orgData);
    }
  }, [userIndex.currentOrgId, orgData]);

  // User context
  const userContext: AmoebaUserContext = useMemo(() => {
    let role: AmoebaRole | null = null;
    if (orgData) {
      if (orgData.organization.owner_id === userId) {
        role = 'owner';
      } else {
        const collab = orgData.collaborators.find(
          (c) => c.user_id === userId && c.status === 'active'
        );
        role = collab?.role || null;
      }
    }
    return {
      userId,
      userName: userInfo?.name || '',
      userEmail: userInfo?.email || '',
      currentOrgId: userIndex.currentOrgId,
      role,
    };
  }, [userId, userInfo, userIndex.currentOrgId, orgData]);

  // Permission check helpers
  const canEdit = userContext.role === 'owner' || userContext.role === 'admin' || userContext.role === 'manager';
  const canAdmin = userContext.role === 'owner' || userContext.role === 'admin';
  const isOwner = userContext.role === 'owner';

  // Activity log helper
  const logActivity = useCallback(
    (action: string, targetType: string, targetName: string, details?: string) => {
      if (!orgData) return;
      const entry: AmoebaActivityLog = {
        id: generateId(),
        organization_id: orgData.organization.id,
        user_id: userId,
        user_name: userInfo?.name || '',
        action,
        target_type: targetType,
        target_name: targetName,
        details,
        created_at: new Date().toISOString(),
      };
      setOrgData((prev) =>
        prev
          ? { ...prev, activityLog: [entry, ...prev.activityLog].slice(0, 500) }
          : prev
      );
    },
    [orgData, userId, userInfo]
  );

  // ========== Multi-Org Management ==========

  // All orgs this user can access
  const allOrganizations = useMemo(() => {
    const orgs: Array<{ org: AmoebaOrganization; role: AmoebaRole }> = [];
    for (const oid of userIndex.ownedOrgIds) {
      const data = loadOrgData(oid);
      if (data) orgs.push({ org: data.organization, role: 'owner' });
    }
    for (const oid of userIndex.sharedOrgIds) {
      const data = loadOrgData(oid);
      if (data) {
        const collab = data.collaborators.find((c) => c.user_id === userId && c.status === 'active');
        if (collab) orgs.push({ org: data.organization, role: collab.role });
      }
    }
    return orgs;
  }, [userIndex, userId]);

  const switchOrganization = useCallback(
    (orgId: string) => {
      const data = loadOrgData(orgId);
      if (data) {
        setOrgData(data);
        setUserIndex((prev) => ({ ...prev, currentOrgId: orgId }));
      }
    },
    []
  );

  const createOrganization = useCallback(
    (org: Omit<AmoebaOrganization, 'id' | 'created_at' | 'owner_id'>) => {
      const newOrg: AmoebaOrganization = {
        ...org,
        id: generateId(),
        owner_id: userId,
        created_at: new Date().toISOString(),
      };
      const newData: OrgData = {
        ...defaultOrgData,
        organization: newOrg,
        collaborators: [],
        activityLog: [],
      };
      saveOrgData(newOrg.id, newData);
      setOrgData(newData);
      setUserIndex((prev) => ({
        ...prev,
        ownedOrgIds: [...prev.ownedOrgIds, newOrg.id],
        currentOrgId: newOrg.id,
      }));
      return newOrg;
    },
    [userId]
  );

  const deleteOrganization = useCallback(
    (orgId: string) => {
      deleteOrgData(orgId);
      setUserIndex((prev) => ({
        ...prev,
        ownedOrgIds: prev.ownedOrgIds.filter((id) => id !== orgId),
        sharedOrgIds: prev.sharedOrgIds.filter((id) => id !== orgId),
        currentOrgId: prev.currentOrgId === orgId ? null : prev.currentOrgId,
      }));
      setOrgData(null);
    },
    []
  );

  // ========== Collaborators ==========

  const addCollaborator = useCallback(
    (email: string, name: string, role: AmoebaRole) => {
      if (!orgData) return null;
      const collab: AmoebaCollaborator = {
        id: generateId(),
        organization_id: orgData.organization.id,
        user_id: email, // use email as user_id for localStorage-based system
        user_email: email,
        user_name: name,
        role,
        invited_by: userId,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      setOrgData((prev) =>
        prev ? { ...prev, collaborators: [...prev.collaborators, collab] } : prev
      );
      // Add org to the invited user's shared list
      const inviteeIndex = getUserIndex(email);
      if (!inviteeIndex.sharedOrgIds.includes(orgData.organization.id)) {
        inviteeIndex.sharedOrgIds.push(orgData.organization.id);
        saveUserIndex(email, inviteeIndex);
      }
      logActivity('邀請協作者', 'collaborator', name, `角色：${role}`);
      return collab;
    },
    [orgData, userId, logActivity]
  );

  const updateCollaboratorRole = useCallback(
    (collaboratorId: string, newRole: AmoebaRole) => {
      setOrgData((prev) => {
        if (!prev) return prev;
        const collab = prev.collaborators.find((c) => c.id === collaboratorId);
        if (collab) {
          logActivity('變更角色', 'collaborator', collab.user_name, `新角色：${newRole}`);
        }
        return {
          ...prev,
          collaborators: prev.collaborators.map((c) =>
            c.id === collaboratorId ? { ...c, role: newRole } : c
          ),
        };
      });
    },
    [logActivity]
  );

  const removeCollaborator = useCallback(
    (collaboratorId: string) => {
      setOrgData((prev) => {
        if (!prev) return prev;
        const collab = prev.collaborators.find((c) => c.id === collaboratorId);
        if (collab) {
          // Remove from invited user's shared list
          const inviteeIndex = getUserIndex(collab.user_id);
          inviteeIndex.sharedOrgIds = inviteeIndex.sharedOrgIds.filter(
            (id) => id !== prev.organization.id
          );
          saveUserIndex(collab.user_id, inviteeIndex);
          logActivity('移除協作者', 'collaborator', collab.user_name);
        }
        return {
          ...prev,
          collaborators: prev.collaborators.map((c) =>
            c.id === collaboratorId ? { ...c, status: 'removed' as const } : c
          ),
        };
      });
    },
    [logActivity]
  );

  // ========== Organization ==========

  const organization = orgData?.organization || null;

  const setOrganization = useCallback(
    (org: Omit<AmoebaOrganization, 'id' | 'created_at' | 'owner_id'>) => {
      createOrganization(org);
    },
    [createOrganization]
  );

  const updateOrganization = useCallback(
    (updates: Partial<AmoebaOrganization>) => {
      setOrgData((prev) =>
        prev
          ? { ...prev, organization: { ...prev.organization, ...updates } }
          : prev
      );
      logActivity('更新組織設定', 'organization', updates.name || '');
    },
    [logActivity]
  );

  // ========== Units ==========

  const units = orgData?.units || [];

  const addUnit = useCallback(
    (unit: Omit<AmoebaUnit, 'id' | 'created_at'>) => {
      const newUnit: AmoebaUnit = { ...unit, id: generateId(), created_at: new Date().toISOString() };
      setOrgData((prev) =>
        prev ? { ...prev, units: [...prev.units, newUnit] } : prev
      );
      logActivity('新增單位', 'unit', unit.name);
      return newUnit;
    },
    [logActivity]
  );

  const updateUnit = useCallback(
    (id: string, updates: Partial<AmoebaUnit>) => {
      setOrgData((prev) =>
        prev
          ? { ...prev, units: prev.units.map((u) => (u.id === id ? { ...u, ...updates } : u)) }
          : prev
      );
    },
    []
  );

  const deleteUnit = useCallback(
    (id: string) => {
      setOrgData((prev) => {
        if (!prev) return prev;
        const unit = prev.units.find((u) => u.id === id);
        if (unit) logActivity('刪除單位', 'unit', unit.name);
        return {
          ...prev,
          units: prev.units.filter((u) => u.id !== id),
          members: prev.members.filter((m) => m.unit_id !== id),
          revenues: prev.revenues.filter((r) => r.unit_id !== id),
          expenses: prev.expenses.filter((e) => e.unit_id !== id),
        };
      });
    },
    [logActivity]
  );

  // ========== Members ==========

  const members = orgData?.members || [];

  const addMember = useCallback(
    (member: Omit<AmoebaMember, 'id'>) => {
      const newMember: AmoebaMember = { ...member, id: generateId() };
      setOrgData((prev) =>
        prev ? { ...prev, members: [...prev.members, newMember] } : prev
      );
      logActivity('新增成員', 'member', member.name);
      return newMember;
    },
    [logActivity]
  );

  const updateMember = useCallback(
    (id: string, updates: Partial<AmoebaMember>) => {
      setOrgData((prev) =>
        prev
          ? { ...prev, members: prev.members.map((m) => (m.id === id ? { ...m, ...updates } : m)) }
          : prev
      );
    },
    []
  );

  const deleteMember = useCallback(
    (id: string) => {
      setOrgData((prev) => {
        if (!prev) return prev;
        const member = prev.members.find((m) => m.id === id);
        if (member) logActivity('移除成員', 'member', member.name);
        return { ...prev, members: prev.members.filter((m) => m.id !== id) };
      });
    },
    [logActivity]
  );

  // ========== Revenue ==========

  const revenues = orgData?.revenues || [];

  const addRevenue = useCallback(
    (item: Omit<AmoebaRevenueItem, 'id' | 'created_at'>) => {
      const newItem: AmoebaRevenueItem = { ...item, id: generateId(), created_at: new Date().toISOString() };
      setOrgData((prev) =>
        prev ? { ...prev, revenues: [...prev.revenues, newItem] } : prev
      );
      logActivity('新增營收', 'revenue', `$${item.amount.toLocaleString()}`, item.category);
      return newItem;
    },
    [logActivity]
  );

  const updateRevenue = useCallback(
    (id: string, updates: Partial<AmoebaRevenueItem>) => {
      setOrgData((prev) =>
        prev
          ? { ...prev, revenues: prev.revenues.map((r) => (r.id === id ? { ...r, ...updates } : r)) }
          : prev
      );
    },
    []
  );

  const deleteRevenue = useCallback(
    (id: string) => {
      setOrgData((prev) => {
        if (!prev) return prev;
        const item = prev.revenues.find((r) => r.id === id);
        if (item) logActivity('刪除營收', 'revenue', `$${item.amount.toLocaleString()}`);
        return { ...prev, revenues: prev.revenues.filter((r) => r.id !== id) };
      });
    },
    [logActivity]
  );

  // ========== Expense ==========

  const expenses = orgData?.expenses || [];

  const addExpense = useCallback(
    (item: Omit<AmoebaExpenseItem, 'id' | 'created_at'>) => {
      const newItem: AmoebaExpenseItem = { ...item, id: generateId(), created_at: new Date().toISOString() };
      setOrgData((prev) =>
        prev ? { ...prev, expenses: [...prev.expenses, newItem] } : prev
      );
      logActivity('新增費用', 'expense', `$${item.amount.toLocaleString()}`, item.category);
      return newItem;
    },
    [logActivity]
  );

  const updateExpense = useCallback(
    (id: string, updates: Partial<AmoebaExpenseItem>) => {
      setOrgData((prev) =>
        prev
          ? { ...prev, expenses: prev.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)) }
          : prev
      );
    },
    []
  );

  const deleteExpense = useCallback(
    (id: string) => {
      setOrgData((prev) => {
        if (!prev) return prev;
        const item = prev.expenses.find((e) => e.id === id);
        if (item) logActivity('刪除費用', 'expense', `$${item.amount.toLocaleString()}`);
        return { ...prev, expenses: prev.expenses.filter((e) => e.id !== id) };
      });
    },
    [logActivity]
  );

  // ========== Transactions ==========

  const transactions = orgData?.transactions || [];

  const addTransaction = useCallback(
    (tx: Omit<AmoebaInternalTransaction, 'id' | 'created_at'>) => {
      const newTx: AmoebaInternalTransaction = { ...tx, id: generateId(), created_at: new Date().toISOString() };
      setOrgData((prev) =>
        prev ? { ...prev, transactions: [...prev.transactions, newTx] } : prev
      );
      logActivity('新增內部交易', 'transaction', `$${tx.amount.toLocaleString()}`);
      return newTx;
    },
    [logActivity]
  );

  const updateTransaction = useCallback(
    (id: string, updates: Partial<AmoebaInternalTransaction>) => {
      setOrgData((prev) =>
        prev
          ? { ...prev, transactions: prev.transactions.map((t) => (t.id === id ? { ...t, ...updates } : t)) }
          : prev
      );
    },
    []
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setOrgData((prev) =>
        prev ? { ...prev, transactions: prev.transactions.filter((t) => t.id !== id) } : prev
      );
    },
    []
  );

  // ========== Goals ==========

  const goals = orgData?.goals || [];

  const addGoal = useCallback(
    (goal: Omit<AmoebaGoal, 'id' | 'created_at'>) => {
      const newGoal: AmoebaGoal = { ...goal, id: generateId(), created_at: new Date().toISOString() };
      setOrgData((prev) =>
        prev ? { ...prev, goals: [...prev.goals, newGoal] } : prev
      );
      logActivity('設定目標', 'goal', `營收目標 $${goal.target_revenue.toLocaleString()}`);
      return newGoal;
    },
    [logActivity]
  );

  const updateGoal = useCallback(
    (id: string, updates: Partial<AmoebaGoal>) => {
      setOrgData((prev) =>
        prev
          ? { ...prev, goals: prev.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)) }
          : prev
      );
    },
    []
  );

  const deleteGoal = useCallback(
    (id: string) => {
      setOrgData((prev) =>
        prev ? { ...prev, goals: prev.goals.filter((g) => g.id !== id) } : prev
      );
    },
    []
  );

  // ========== Budgets ==========

  const budgets = orgData?.budgets || [];

  const addBudget = useCallback(
    (budget: Omit<AmoebaBudget, 'id' | 'created_at'>) => {
      const newBudget: AmoebaBudget = { ...budget, id: generateId(), created_at: new Date().toISOString() };
      setOrgData((prev) =>
        prev ? { ...prev, budgets: [...prev.budgets, newBudget] } : prev
      );
      logActivity('新增預算', 'budget', `$${budget.planned_amount.toLocaleString()}`, budget.category);
      return newBudget;
    },
    [logActivity]
  );

  const updateBudget = useCallback(
    (id: string, updates: Partial<AmoebaBudget>) => {
      setOrgData((prev) =>
        prev
          ? { ...prev, budgets: prev.budgets.map((b) => (b.id === id ? { ...b, ...updates } : b)) }
          : prev
      );
    },
    []
  );

  const deleteBudget = useCallback(
    (id: string) => {
      setOrgData((prev) =>
        prev ? { ...prev, budgets: prev.budgets.filter((b) => b.id !== id) } : prev
      );
    },
    []
  );

  // ========== Reports ==========

  const getMonthlyReport = useCallback(
    (unitId: string, period: string): AmoebaMonthlyReport | null => {
      if (!orgData) return null;
      const unit = orgData.units.find((u) => u.id === unitId);
      if (!unit) return null;

      const unitMembers = orgData.members.filter((m) => m.unit_id === unitId && m.is_active);
      const unitRevenues = orgData.revenues.filter((r) => r.unit_id === unitId && r.period === period);
      const unitExpenses = orgData.expenses.filter((e) => e.unit_id === unitId && e.period === period);

      const externalRevenue = unitRevenues.filter((r) => r.source === 'external').reduce((s, r) => s + r.amount, 0);
      const internalRevenue = unitRevenues.filter((r) => r.source === 'internal').reduce((s, r) => s + r.amount, 0);
      const totalRevenue = externalRevenue + internalRevenue;
      const laborCost = unitExpenses.filter((e) => e.is_labor_cost).reduce((s, e) => s + e.amount, 0);
      const nonLaborCost = unitExpenses.filter((e) => !e.is_labor_cost).reduce((s, e) => s + e.amount, 0);
      const totalExpense = laborCost + nonLaborCost;
      const grossProfit = totalRevenue - nonLaborCost;
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
    },
    [orgData]
  );

  const getAllReports = useCallback(
    (period: string): AmoebaMonthlyReport[] => {
      if (!orgData) return [];
      return orgData.units
        .filter((u) => u.is_active)
        .map((u) => getMonthlyReport(u.id, period))
        .filter((r): r is AmoebaMonthlyReport => r !== null);
    },
    [orgData, getMonthlyReport]
  );

  // ========== Activity Log ==========

  const activityLog = orgData?.activityLog || [];
  const collaborators = orgData?.collaborators.filter((c) => c.status !== 'removed') || [];

  // ========== Reset ==========

  const resetStore = useCallback(() => {
    if (userIndex.currentOrgId) {
      deleteOrgData(userIndex.currentOrgId);
      setUserIndex((prev) => ({
        ...prev,
        ownedOrgIds: prev.ownedOrgIds.filter((id) => id !== prev.currentOrgId),
        currentOrgId: null,
      }));
      setOrgData(null);
    }
  }, [userIndex.currentOrgId]);

  return {
    // User context
    userContext,
    canEdit,
    canAdmin,
    isOwner,

    // Multi-org
    allOrganizations,
    switchOrganization,
    createOrganization,
    deleteOrganization,

    // Collaborators
    collaborators,
    addCollaborator,
    updateCollaboratorRole,
    removeCollaborator,

    // Activity log
    activityLog,

    // Organization
    organization,
    setOrganization,
    updateOrganization,

    // Units
    units,
    addUnit,
    updateUnit,
    deleteUnit,

    // Members
    members,
    addMember,
    updateMember,
    deleteMember,

    // Revenue
    revenues,
    addRevenue,
    updateRevenue,
    deleteRevenue,

    // Expense
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,

    // Transactions
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,

    // Goals
    goals,
    addGoal,
    updateGoal,
    deleteGoal,

    // Budgets
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,

    // Reports
    getMonthlyReport,
    getAllReports,

    // Reset
    resetStore,
  };
}
