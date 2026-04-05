-- 阿米巴經營管理系統 - 目標、預算、獎金規則表

-- 1. 目標設定表
CREATE TABLE IF NOT EXISTS amoeba_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES amoeba_units(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL,
  target_revenue NUMERIC(14, 2) DEFAULT 0,
  target_expense NUMERIC(14, 2) DEFAULT 0,
  target_profit NUMERIC(14, 2) DEFAULT 0,
  target_hourly_efficiency NUMERIC(12, 2) DEFAULT 0,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 預算管理表
CREATE TABLE IF NOT EXISTS amoeba_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES amoeba_units(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_type TEXT NOT NULL CHECK (budget_type IN ('revenue', 'expense')),
  planned_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 獎金規則表
CREATE TABLE IF NOT EXISTS amoeba_bonus_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES amoeba_organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('profit_ratio', 'efficiency_tier', 'goal_achievement', 'fixed_pool_split')),
  is_active BOOLEAN DEFAULT true,
  profit_share_percent NUMERIC(5, 2) DEFAULT 10,
  efficiency_tiers JSONB DEFAULT '[]'::jsonb,
  achievement_base_percent NUMERIC(5, 2) DEFAULT 10,
  achievement_exceed_bonus NUMERIC(5, 2) DEFAULT 0.5,
  achievement_min_threshold NUMERIC(5, 2) DEFAULT 60,
  fixed_pool_amount NUMERIC(14, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_amoeba_goals_unit_period ON amoeba_goals(unit_id, period);
CREATE INDEX IF NOT EXISTS idx_amoeba_budgets_unit_period ON amoeba_budgets(unit_id, period);
CREATE INDEX IF NOT EXISTS idx_amoeba_bonus_rules_org ON amoeba_bonus_rules(organization_id);

-- RLS
ALTER TABLE amoeba_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE amoeba_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE amoeba_bonus_rules ENABLE ROW LEVEL SECURITY;

-- Goals policy (via unit → org → owner/collaborator)
CREATE POLICY "Org members can manage goals" ON amoeba_goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_units
      JOIN amoeba_organizations ON amoeba_organizations.id = amoeba_units.organization_id
      WHERE amoeba_units.id = amoeba_goals.unit_id
      AND (
        amoeba_organizations.user_id = auth.uid()
        OR amoeba_organizations.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM amoeba_collaborators
          WHERE amoeba_collaborators.organization_id = amoeba_organizations.id
          AND amoeba_collaborators.user_id = auth.uid()
          AND amoeba_collaborators.status = 'active'
        )
      )
    )
  );

-- Budgets policy
CREATE POLICY "Org members can manage budgets" ON amoeba_budgets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_units
      JOIN amoeba_organizations ON amoeba_organizations.id = amoeba_units.organization_id
      WHERE amoeba_units.id = amoeba_budgets.unit_id
      AND (
        amoeba_organizations.user_id = auth.uid()
        OR amoeba_organizations.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM amoeba_collaborators
          WHERE amoeba_collaborators.organization_id = amoeba_organizations.id
          AND amoeba_collaborators.user_id = auth.uid()
          AND amoeba_collaborators.status = 'active'
        )
      )
    )
  );

-- Bonus rules policy (via org → owner/collaborator)
CREATE POLICY "Org members can manage bonus rules" ON amoeba_bonus_rules
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_organizations
      WHERE amoeba_organizations.id = amoeba_bonus_rules.organization_id
      AND (
        amoeba_organizations.user_id = auth.uid()
        OR amoeba_organizations.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM amoeba_collaborators
          WHERE amoeba_collaborators.organization_id = amoeba_organizations.id
          AND amoeba_collaborators.user_id = auth.uid()
          AND amoeba_collaborators.status = 'active'
        )
      )
    )
  );

-- Triggers
CREATE TRIGGER update_amoeba_goals_updated_at
  BEFORE UPDATE ON amoeba_goals
  FOR EACH ROW EXECUTE FUNCTION update_amoeba_updated_at();

CREATE TRIGGER update_amoeba_budgets_updated_at
  BEFORE UPDATE ON amoeba_budgets
  FOR EACH ROW EXECUTE FUNCTION update_amoeba_updated_at();

CREATE TRIGGER update_amoeba_bonus_rules_updated_at
  BEFORE UPDATE ON amoeba_bonus_rules
  FOR EACH ROW EXECUTE FUNCTION update_amoeba_updated_at();
