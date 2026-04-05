/**
 * 阿米巴經營管理系統 - Supabase 資料服務層
 *
 * 所有 Supabase CRUD 操作集中於此，供 React Query hooks 調用。
 * 使用 RLS 確保資料隔離，不需手動篩選 user_id。
 */

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
  AmoebaCollaborator,
  AmoebaActivityLog,
  EfficiencyTier,
} from '@/types/amoeba';

// ============================================================
// Helpers
// ============================================================

async function unwrap<T>(promise: PromiseLike<{ data: T | null; error: any }>): Promise<T> {
  const { data, error } = await promise;
  if (error) throw error;
  return data as T;
}

// ============================================================
// Organizations
// ============================================================

export async function fetchOrganizations() {
  // Fetch orgs where user is owner
  const { data: owned } = await supabase
    .from('amoeba_organizations')
    .select('*')
    .order('created_at', { ascending: false });

  // Fetch orgs where user is collaborator
  const { data: collabs } = await supabase
    .from('amoeba_collaborators')
    .select('organization_id, role, amoeba_organizations(*)')
    .eq('status', 'active');

  const orgs: Array<{ org: AmoebaOrganization; role: string }> = [];

  (owned || []).forEach((o: any) => {
    orgs.push({ org: mapOrg(o), role: 'owner' });
  });

  (collabs || []).forEach((c: any) => {
    if (c.amoeba_organizations) {
      orgs.push({ org: mapOrg(c.amoeba_organizations), role: c.role });
    }
  });

  return orgs;
}

export async function createOrganization(data: {
  name: string;
  description?: string;
  fiscal_year_start?: number;
  currency?: string;
}) {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('未登入');

  return unwrap(
    supabase
      .from('amoeba_organizations')
      .insert({
        user_id: user.user.id,
        owner_id: user.user.id,
        name: data.name,
        description: data.description || '',
        fiscal_year_start: data.fiscal_year_start || 1,
        currency: data.currency || 'TWD',
      })
      .select()
      .single()
  );
}

export async function updateOrganization(id: string, updates: Partial<AmoebaOrganization>) {
  return unwrap(
    supabase.from('amoeba_organizations').update(updates).eq('id', id).select().single()
  );
}

export async function deleteOrganization(id: string) {
  return unwrap(supabase.from('amoeba_organizations').delete().eq('id', id));
}

// ============================================================
// Units
// ============================================================

export async function fetchUnits(orgId: string) {
  return unwrap(
    supabase.from('amoeba_units').select('*').eq('organization_id', orgId).order('code')
  ) as Promise<any[]>;
}

export async function createUnit(data: Omit<AmoebaUnit, 'id' | 'created_at'>) {
  return unwrap(supabase.from('amoeba_units').insert(data).select().single());
}

export async function updateUnit(id: string, updates: Partial<AmoebaUnit>) {
  return unwrap(supabase.from('amoeba_units').update(updates).eq('id', id).select().single());
}

export async function deleteUnit(id: string) {
  return unwrap(supabase.from('amoeba_units').delete().eq('id', id));
}

// ============================================================
// Members
// ============================================================

export async function fetchMembers(unitIds: string[]) {
  if (unitIds.length === 0) return [];
  return unwrap(
    supabase.from('amoeba_members').select('*').in('unit_id', unitIds).order('name')
  ) as Promise<any[]>;
}

export async function createMember(data: Omit<AmoebaMember, 'id'>) {
  return unwrap(supabase.from('amoeba_members').insert(data).select().single());
}

export async function updateMember(id: string, updates: Partial<AmoebaMember>) {
  return unwrap(supabase.from('amoeba_members').update(updates).eq('id', id).select().single());
}

export async function deleteMember(id: string) {
  return unwrap(supabase.from('amoeba_members').delete().eq('id', id));
}

// ============================================================
// Revenue
// ============================================================

export async function fetchRevenues(unitIds: string[], period?: string) {
  if (unitIds.length === 0) return [];
  let query = supabase.from('amoeba_revenue_items').select('*').in('unit_id', unitIds);
  if (period) query = query.eq('period', period);
  return unwrap(query.order('created_at', { ascending: false })) as Promise<any[]>;
}

export async function createRevenue(data: Omit<AmoebaRevenueItem, 'id' | 'created_at'>) {
  return unwrap(supabase.from('amoeba_revenue_items').insert(data).select().single());
}

export async function updateRevenue(id: string, updates: Partial<AmoebaRevenueItem>) {
  return unwrap(supabase.from('amoeba_revenue_items').update(updates).eq('id', id).select().single());
}

export async function deleteRevenue(id: string) {
  return unwrap(supabase.from('amoeba_revenue_items').delete().eq('id', id));
}

// ============================================================
// Expense
// ============================================================

export async function fetchExpenses(unitIds: string[], period?: string) {
  if (unitIds.length === 0) return [];
  let query = supabase.from('amoeba_expense_items').select('*').in('unit_id', unitIds);
  if (period) query = query.eq('period', period);
  return unwrap(query.order('created_at', { ascending: false })) as Promise<any[]>;
}

export async function createExpense(data: Omit<AmoebaExpenseItem, 'id' | 'created_at'>) {
  return unwrap(supabase.from('amoeba_expense_items').insert(data).select().single());
}

export async function updateExpense(id: string, updates: Partial<AmoebaExpenseItem>) {
  return unwrap(supabase.from('amoeba_expense_items').update(updates).eq('id', id).select().single());
}

export async function deleteExpense(id: string) {
  return unwrap(supabase.from('amoeba_expense_items').delete().eq('id', id));
}

// ============================================================
// Internal Transactions
// ============================================================

export async function fetchTransactions(unitIds: string[], period?: string) {
  if (unitIds.length === 0) return [];
  let query = supabase
    .from('amoeba_internal_transactions')
    .select('*')
    .or(`from_unit_id.in.(${unitIds.join(',')}),to_unit_id.in.(${unitIds.join(',')})`);
  if (period) query = query.eq('period', period);
  return unwrap(query.order('created_at', { ascending: false })) as Promise<any[]>;
}

export async function createTransaction(data: Omit<AmoebaInternalTransaction, 'id' | 'created_at'>) {
  return unwrap(supabase.from('amoeba_internal_transactions').insert(data).select().single());
}

export async function updateTransaction(id: string, updates: Partial<AmoebaInternalTransaction>) {
  return unwrap(supabase.from('amoeba_internal_transactions').update(updates).eq('id', id).select().single());
}

export async function deleteTransaction(id: string) {
  return unwrap(supabase.from('amoeba_internal_transactions').delete().eq('id', id));
}

// ============================================================
// Goals
// ============================================================

export async function fetchGoals(unitIds: string[], period?: string) {
  if (unitIds.length === 0) return [];
  let query = supabase.from('amoeba_goals').select('*').in('unit_id', unitIds);
  if (period) query = query.eq('period', period);
  return unwrap(query.order('created_at', { ascending: false })) as Promise<any[]>;
}

export async function createGoal(data: Omit<AmoebaGoal, 'id' | 'created_at'>) {
  return unwrap(supabase.from('amoeba_goals').insert(data).select().single());
}

export async function updateGoal(id: string, updates: Partial<AmoebaGoal>) {
  return unwrap(supabase.from('amoeba_goals').update(updates).eq('id', id).select().single());
}

export async function deleteGoal(id: string) {
  return unwrap(supabase.from('amoeba_goals').delete().eq('id', id));
}

// ============================================================
// Budgets
// ============================================================

export async function fetchBudgets(unitIds: string[], period?: string) {
  if (unitIds.length === 0) return [];
  let query = supabase.from('amoeba_budgets').select('*').in('unit_id', unitIds);
  if (period) query = query.eq('period', period);
  return unwrap(query.order('created_at', { ascending: false })) as Promise<any[]>;
}

export async function createBudget(data: Omit<AmoebaBudget, 'id' | 'created_at'>) {
  return unwrap(supabase.from('amoeba_budgets').insert(data).select().single());
}

export async function updateBudget(id: string, updates: Partial<AmoebaBudget>) {
  return unwrap(supabase.from('amoeba_budgets').update(updates).eq('id', id).select().single());
}

export async function deleteBudget(id: string) {
  return unwrap(supabase.from('amoeba_budgets').delete().eq('id', id));
}

// ============================================================
// Bonus Rules
// ============================================================

export async function fetchBonusRules(orgId: string) {
  return unwrap(
    supabase.from('amoeba_bonus_rules').select('*').eq('organization_id', orgId).order('created_at', { ascending: false })
  ) as Promise<any[]>;
}

export async function createBonusRule(data: {
  organization_id: string;
  name: string;
  method: string;
  is_active: boolean;
  profit_share_percent: number;
  efficiency_tiers: EfficiencyTier[];
  achievement_base_percent: number;
  achievement_exceed_bonus: number;
  achievement_min_threshold: number;
  fixed_pool_amount: number;
}) {
  return unwrap(supabase.from('amoeba_bonus_rules').insert(data).select().single());
}

export async function updateBonusRule(id: string, updates: Record<string, any>) {
  return unwrap(supabase.from('amoeba_bonus_rules').update(updates).eq('id', id).select().single());
}

export async function deleteBonusRule(id: string) {
  return unwrap(supabase.from('amoeba_bonus_rules').delete().eq('id', id));
}

// ============================================================
// Collaborators
// ============================================================

export async function fetchCollaborators(orgId: string) {
  return unwrap(
    supabase
      .from('amoeba_collaborators')
      .select('*')
      .eq('organization_id', orgId)
      .neq('status', 'removed')
      .order('created_at')
  ) as Promise<any[]>;
}

export async function addCollaborator(data: {
  organization_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role: string;
  invited_by: string;
}) {
  return unwrap(
    supabase.from('amoeba_collaborators').insert({ ...data, status: 'active' }).select().single()
  );
}

export async function updateCollaboratorRole(id: string, role: string) {
  return unwrap(
    supabase.from('amoeba_collaborators').update({ role }).eq('id', id).select().single()
  );
}

export async function removeCollaborator(id: string) {
  return unwrap(
    supabase.from('amoeba_collaborators').update({ status: 'removed' }).eq('id', id).select().single()
  );
}

// ============================================================
// Activity Log
// ============================================================

export async function fetchActivityLog(orgId: string, limit = 100) {
  return unwrap(
    supabase
      .from('amoeba_activity_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit)
  ) as Promise<any[]>;
}

export async function insertActivityLog(data: {
  organization_id: string;
  user_id: string;
  user_name: string;
  action: string;
  target_type: string;
  target_name: string;
  details?: string;
}) {
  return supabase.from('amoeba_activity_logs').insert(data);
}

// ============================================================
// Real-time subscription
// ============================================================

export function subscribeToOrgChanges(
  orgId: string,
  tables: string[],
  callback: () => void
) {
  const channel = supabase.channel(`amoeba-org-${orgId}`);

  tables.forEach((table) => {
    channel.on(
      'postgres_changes' as any,
      { event: '*', schema: 'public', table },
      () => callback()
    );
  });

  channel.subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ============================================================
// Mapper helpers
// ============================================================

function mapOrg(row: any): AmoebaOrganization {
  return {
    id: row.id,
    owner_id: row.owner_id || row.user_id,
    name: row.name,
    description: row.description || '',
    fiscal_year_start: row.fiscal_year_start || 1,
    currency: row.currency || 'TWD',
    created_at: row.created_at,
  };
}
