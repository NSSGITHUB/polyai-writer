// 阿米巴經營管理系統 - 資料型別定義

// 阿米巴組織
export interface AmoebaOrganization {
  id: string;
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
  code: string; // 編號，例如 "A001"
  parent_id: string | null; // 上層阿米巴（用於階層結構）
  leader_name: string;
  type: 'profit_center' | 'cost_center'; // 利潤中心 / 成本中心
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
  hourly_rate: number; // 時薪（用於計算人工成本）
  monthly_hours: number; // 月工時
  is_active: boolean;
}

// 營收項目
export interface AmoebaRevenueItem {
  id: string;
  unit_id: string;
  period: string; // YYYY-MM 格式
  category: string;
  description: string;
  amount: number;
  source: 'external' | 'internal'; // 外部營收 or 內部交易營收
  related_transaction_id?: string;
  created_at: string;
}

// 費用項目
export interface AmoebaExpenseItem {
  id: string;
  unit_id: string;
  period: string; // YYYY-MM 格式
  category: string;
  description: string;
  amount: number;
  is_labor_cost: boolean; // 是否為人事費用
  source: 'external' | 'internal';
  related_transaction_id?: string;
  created_at: string;
}

// 內部交易
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

// 月度報表 - 單位時間附加價值
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
  gross_profit: number; // 附加價值 = 營收 - 費用（不含人事）
  total_labor_hours: number;
  hourly_efficiency: number; // 單位時間附加價值 = 附加價值 / 總工時
  member_count: number;
  profit_margin: number; // 利潤率
}

// 費用類別預設
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

// 營收類別預設
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
