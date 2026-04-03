-- 阿米巴經營管理系統 資料表建立

-- 1. 阿米巴組織表
CREATE TABLE IF NOT EXISTS amoeba_organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  fiscal_year_start INTEGER DEFAULT 1 CHECK (fiscal_year_start BETWEEN 1 AND 12),
  currency TEXT DEFAULT 'TWD',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 阿米巴單位表
CREATE TABLE IF NOT EXISTS amoeba_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES amoeba_organizations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  parent_id UUID REFERENCES amoeba_units(id) ON DELETE SET NULL,
  leader_name TEXT DEFAULT '',
  type TEXT DEFAULT 'profit_center' CHECK (type IN ('profit_center', 'cost_center')),
  description TEXT DEFAULT '',
  member_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 阿米巴成員表
CREATE TABLE IF NOT EXISTS amoeba_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES amoeba_units(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT '',
  hourly_rate NUMERIC(12, 2) DEFAULT 0,
  monthly_hours NUMERIC(8, 2) DEFAULT 176,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 營收項目表
CREATE TABLE IF NOT EXISTS amoeba_revenue_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES amoeba_units(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL, -- YYYY-MM
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  source TEXT DEFAULT 'external' CHECK (source IN ('external', 'internal')),
  related_transaction_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. 費用項目表
CREATE TABLE IF NOT EXISTS amoeba_expense_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES amoeba_units(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL, -- YYYY-MM
  category TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  is_labor_cost BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'external' CHECK (source IN ('external', 'internal')),
  related_transaction_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. 內部交易表
CREATE TABLE IF NOT EXISTS amoeba_internal_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_unit_id UUID REFERENCES amoeba_units(id) ON DELETE CASCADE NOT NULL,
  to_unit_id UUID REFERENCES amoeba_units(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL,
  description TEXT DEFAULT '',
  amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_amoeba_units_org ON amoeba_units(organization_id);
CREATE INDEX IF NOT EXISTS idx_amoeba_members_unit ON amoeba_members(unit_id);
CREATE INDEX IF NOT EXISTS idx_amoeba_revenue_unit_period ON amoeba_revenue_items(unit_id, period);
CREATE INDEX IF NOT EXISTS idx_amoeba_expense_unit_period ON amoeba_expense_items(unit_id, period);
CREATE INDEX IF NOT EXISTS idx_amoeba_transactions_period ON amoeba_internal_transactions(period);

-- RLS Policies
ALTER TABLE amoeba_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE amoeba_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE amoeba_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE amoeba_revenue_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE amoeba_expense_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE amoeba_internal_transactions ENABLE ROW LEVEL SECURITY;

-- Organization policies
CREATE POLICY "Users can view own organizations" ON amoeba_organizations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own organizations" ON amoeba_organizations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own organizations" ON amoeba_organizations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own organizations" ON amoeba_organizations
  FOR DELETE USING (auth.uid() = user_id);

-- Unit policies (via org ownership)
CREATE POLICY "Users can manage units in own orgs" ON amoeba_units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_organizations
      WHERE amoeba_organizations.id = amoeba_units.organization_id
      AND amoeba_organizations.user_id = auth.uid()
    )
  );

-- Member policies
CREATE POLICY "Users can manage members in own orgs" ON amoeba_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_units
      JOIN amoeba_organizations ON amoeba_organizations.id = amoeba_units.organization_id
      WHERE amoeba_units.id = amoeba_members.unit_id
      AND amoeba_organizations.user_id = auth.uid()
    )
  );

-- Revenue policies
CREATE POLICY "Users can manage revenue in own orgs" ON amoeba_revenue_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_units
      JOIN amoeba_organizations ON amoeba_organizations.id = amoeba_units.organization_id
      WHERE amoeba_units.id = amoeba_revenue_items.unit_id
      AND amoeba_organizations.user_id = auth.uid()
    )
  );

-- Expense policies
CREATE POLICY "Users can manage expenses in own orgs" ON amoeba_expense_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_units
      JOIN amoeba_organizations ON amoeba_organizations.id = amoeba_units.organization_id
      WHERE amoeba_units.id = amoeba_expense_items.unit_id
      AND amoeba_organizations.user_id = auth.uid()
    )
  );

-- Transaction policies
CREATE POLICY "Users can manage transactions in own orgs" ON amoeba_internal_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_units
      JOIN amoeba_organizations ON amoeba_organizations.id = amoeba_units.organization_id
      WHERE amoeba_units.id = amoeba_internal_transactions.from_unit_id
      AND amoeba_organizations.user_id = auth.uid()
    )
  );

-- Auto update updated_at triggers
CREATE OR REPLACE FUNCTION update_amoeba_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_amoeba_organizations_updated_at
  BEFORE UPDATE ON amoeba_organizations
  FOR EACH ROW EXECUTE FUNCTION update_amoeba_updated_at();

CREATE TRIGGER update_amoeba_units_updated_at
  BEFORE UPDATE ON amoeba_units
  FOR EACH ROW EXECUTE FUNCTION update_amoeba_updated_at();

CREATE TRIGGER update_amoeba_members_updated_at
  BEFORE UPDATE ON amoeba_members
  FOR EACH ROW EXECUTE FUNCTION update_amoeba_updated_at();

CREATE TRIGGER update_amoeba_revenue_items_updated_at
  BEFORE UPDATE ON amoeba_revenue_items
  FOR EACH ROW EXECUTE FUNCTION update_amoeba_updated_at();

CREATE TRIGGER update_amoeba_expense_items_updated_at
  BEFORE UPDATE ON amoeba_expense_items
  FOR EACH ROW EXECUTE FUNCTION update_amoeba_updated_at();

CREATE TRIGGER update_amoeba_internal_transactions_updated_at
  BEFORE UPDATE ON amoeba_internal_transactions
  FOR EACH ROW EXECUTE FUNCTION update_amoeba_updated_at();
