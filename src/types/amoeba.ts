// 阿米巴經營管理系統 - 資料型別定義（多用戶版）

// ============================================================
// 使用者與權限
// ============================================================

export type AmoebaRole = 'owner' | 'admin' | 'manager' | 'viewer';

export const ROLE_LABELS: Record<AmoebaRole, string> = {
  owner: '擁有者',
  admin: '管理員',
  manager: '經理',
  viewer: '檢視者',
};

export const ROLE_DESCRIPTIONS: Record<AmoebaRole, string> = {
  owner: '完全控制，可管理協作者與刪除組織',
  admin: '可編輯所有資料，不可刪除組織',
  manager: '可編輯經營數據（營收/費用/交易）',
  viewer: '唯讀，僅能查看報表與數據',
};

// 協作者
export interface AmoebaCollaborator {
  id: string;
  organization_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  role: AmoebaRole;
  invited_by: string;
  status: 'pending' | 'active' | 'removed';
  created_at: string;
}

// 活動日誌
export interface AmoebaActivityLog {
  id: string;
  organization_id: string;
  user_id: string;
  user_name: string;
  action: string; // e.g. "新增營收", "編輯單位", "邀請成員"
  target_type: string; // e.g. "revenue", "unit", "collaborator"
  target_name: string; // e.g. "業務一部", "$50,000"
  details?: string;
  created_at: string;
}

// ============================================================
// 核心組織模型
// ============================================================

// 阿米巴組織（多組織支援）
export interface AmoebaOrganization {
  id: string;
  owner_id: string; // 建立者
  name: string;
  description: string;
  fiscal_year_start: number; // 1-12, 會計年度起始月
  currency: string;
  created_at: string;
}

// 阿米巴單位
export interface AmoebaUnit {
  id: string;
  organization_id: string;
  name: string;
  code: string;
  parent_id: string | null;
  leader_name: string;
  type: 'profit_center' | 'cost_center';
  description: string;
  member_count: number;
  is_active: boolean;
  created_at: string;
}

// 阿米巴成員
export interface AmoebaMember {
  id: string;
  unit_id: string;
  name: string;
  role: string;
  hourly_rate: number;
  monthly_hours: number;
  is_active: boolean;
}

// ============================================================
// 經營數據
// ============================================================

export interface AmoebaRevenueItem {
  id: string;
  unit_id: string;
  period: string;
  category: string;
  description: string;
  amount: number;
  source: 'external' | 'internal';
  related_transaction_id?: string;
  created_at: string;
}

export interface AmoebaExpenseItem {
  id: string;
  unit_id: string;
  period: string;
  category: string;
  description: string;
  amount: number;
  is_labor_cost: boolean;
  source: 'external' | 'internal';
  related_transaction_id?: string;
  created_at: string;
}

export interface AmoebaInternalTransaction {
  id: string;
  from_unit_id: string;
  to_unit_id: string;
  period: string;
  description: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'rejected';
  created_at: string;
}

// ============================================================
// 報表
// ============================================================

export interface AmoebaMonthlyReport {
  unit_id: string;
  unit_name: string;
  unit_code: string;
  period: string;
  total_revenue: number;
  external_revenue: number;
  internal_revenue: number;
  total_expense: number;
  labor_cost: number;
  non_labor_cost: number;
  gross_profit: number;
  total_labor_hours: number;
  hourly_efficiency: number;
  member_count: number;
  profit_margin: number;
}

// ============================================================
// 目標與預算
// ============================================================

export interface AmoebaGoal {
  id: string;
  unit_id: string;
  period: string;
  target_revenue: number;
  target_expense: number;
  target_profit: number;
  target_hourly_efficiency: number;
  note: string;
  created_at: string;
}

export interface AmoebaBudget {
  id: string;
  unit_id: string;
  period: string;
  category: string;
  budget_type: 'revenue' | 'expense';
  planned_amount: number;
  note: string;
  created_at: string;
}

// ============================================================
// 績效獎金
// ============================================================

// 獎金計算方式
export type BonusCalcMethod =
  | 'profit_ratio'          // 依利潤提撥比例
  | 'efficiency_tier'       // 依單位時間效率分級
  | 'goal_achievement'      // 依目標達成率
  | 'fixed_pool_split';     // 固定獎金池均分

export const BONUS_METHOD_LABELS: Record<BonusCalcMethod, string> = {
  profit_ratio: '利潤提撥制',
  efficiency_tier: '效率分級制',
  goal_achievement: '目標達成制',
  fixed_pool_split: '獎金池均分制',
};

export const BONUS_METHOD_DESCRIPTIONS: Record<BonusCalcMethod, string> = {
  profit_ratio: '從附加價值中按設定比例提撥作為獎金，再依成員工時占比分配',
  efficiency_tier: '依單位時間效率達到的級距，決定獎金乘數 × 基本薪資',
  goal_achievement: '依目標達成率決定獎金比例，超額達成可額外獎勵',
  fixed_pool_split: '設定每月固定獎金池，依各單位附加價值占比分配',
};

// 效率分級門檻
export interface EfficiencyTier {
  min_efficiency: number;    // 最低效率門檻（含）
  max_efficiency: number;    // 最高效率門檻（不含，0 代表無上限）
  multiplier: number;        // 獎金乘數（× 基本月薪比例）
  label: string;             // 級距名稱
}

// 獎金規則
export interface AmoebaBonusRule {
  id: string;
  name: string;
  method: BonusCalcMethod;
  is_active: boolean;

  // 利潤提撥制參數
  profit_share_percent: number;         // 利潤提撥比例 %

  // 效率分級制參數
  efficiency_tiers: EfficiencyTier[];

  // 目標達成制參數
  achievement_base_percent: number;     // 基礎獎金比例（達成100%時）
  achievement_exceed_bonus: number;     // 每超標1%的額外獎金比例
  achievement_min_threshold: number;    // 最低達成率門檻（低於此不發放）

  // 獎金池均分制參數
  fixed_pool_amount: number;            // 每月固定獎金池金額

  created_at: string;
}

// 個人獎金計算結果
export interface AmoebaBonusResult {
  member_id: string;
  member_name: string;
  member_role: string;
  unit_id: string;
  unit_name: string;
  unit_code: string;
  period: string;
  base_salary: number;          // 基本月薪
  monthly_hours: number;
  bonus_amount: number;          // 獎金金額
  bonus_ratio: number;           // 獎金佔薪比 %
  calc_method: BonusCalcMethod;
  calc_detail: string;           // 計算說明
}

// 單位獎金匯總
export interface AmoebaUnitBonusSummary {
  unit_id: string;
  unit_name: string;
  unit_code: string;
  period: string;
  total_bonus: number;
  member_count: number;
  avg_bonus: number;
  profit_contribution: number;
  efficiency: number;
}

// ============================================================
// 常數
// ============================================================

export const EXPENSE_CATEGORIES = [
  '原材料費',
  '人事費用',
  '外包費用',
  '辦公費用',
  '交通費用',
  '通訊費用',
  '折舊費用',
  '水電費用',
  '租金費用',
  '行銷費用',
  '教育訓練費',
  '其他費用',
] as const;

export const REVENUE_CATEGORIES = [
  '產品銷售',
  '服務收入',
  '技術授權',
  '顧問收入',
  '維護合約',
  '內部服務',
  '其他收入',
] as const;

// Setup Wizard 步驟
export interface AmoebaSetupState {
  step: number;
  organization: Partial<AmoebaOrganization>;
  units: Partial<AmoebaUnit>[];
  members: Record<string, Partial<AmoebaMember>[]>;
}

// 當前使用者在阿米巴系統中的身份
export interface AmoebaUserContext {
  userId: string;
  userName: string;
  userEmail: string;
  currentOrgId: string | null;
  role: AmoebaRole | null;
}
