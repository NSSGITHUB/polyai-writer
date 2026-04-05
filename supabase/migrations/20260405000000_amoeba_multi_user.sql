-- 阿米巴經營管理系統 - 多用戶協作擴充

-- 1. 為 amoeba_organizations 新增 owner_id（如尚未存在）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'amoeba_organizations' AND column_name = 'owner_id'
  ) THEN
    ALTER TABLE amoeba_organizations ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    -- 將現有組織的 owner_id 設為 user_id
    UPDATE amoeba_organizations SET owner_id = user_id WHERE owner_id IS NULL;
  END IF;
END $$;

-- 2. 協作者表
CREATE TABLE IF NOT EXISTS amoeba_collaborators (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES amoeba_organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'viewer')),
  invited_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- 3. 活動日誌表
CREATE TABLE IF NOT EXISTS amoeba_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES amoeba_organizations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  user_name TEXT DEFAULT '',
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_name TEXT DEFAULT '',
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_amoeba_collaborators_org ON amoeba_collaborators(organization_id);
CREATE INDEX IF NOT EXISTS idx_amoeba_collaborators_user ON amoeba_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_amoeba_activity_org ON amoeba_activity_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_amoeba_activity_created ON amoeba_activity_logs(created_at DESC);

-- RLS
ALTER TABLE amoeba_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE amoeba_activity_logs ENABLE ROW LEVEL SECURITY;

-- Collaborator policies: org owner or the collaborator themselves
CREATE POLICY "Org owners can manage collaborators" ON amoeba_collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_organizations
      WHERE amoeba_organizations.id = amoeba_collaborators.organization_id
      AND (amoeba_organizations.user_id = auth.uid() OR amoeba_organizations.owner_id = auth.uid())
    )
  );

CREATE POLICY "Collaborators can view their own records" ON amoeba_collaborators
  FOR SELECT USING (user_id = auth.uid());

-- Activity log: accessible by org members
CREATE POLICY "Org members can view activity logs" ON amoeba_activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM amoeba_organizations
      WHERE amoeba_organizations.id = amoeba_activity_logs.organization_id
      AND (
        amoeba_organizations.user_id = auth.uid()
        OR amoeba_organizations.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM amoeba_collaborators
          WHERE amoeba_collaborators.organization_id = amoeba_activity_logs.organization_id
          AND amoeba_collaborators.user_id = auth.uid()
          AND amoeba_collaborators.status = 'active'
        )
      )
    )
  );

CREATE POLICY "Org members can insert activity logs" ON amoeba_activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM amoeba_organizations
      WHERE amoeba_organizations.id = amoeba_activity_logs.organization_id
      AND (
        amoeba_organizations.user_id = auth.uid()
        OR amoeba_organizations.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM amoeba_collaborators
          WHERE amoeba_collaborators.organization_id = amoeba_activity_logs.organization_id
          AND amoeba_collaborators.user_id = auth.uid()
          AND amoeba_collaborators.status = 'active'
        )
      )
    )
  );

-- Update existing unit/revenue/expense policies to allow collaborator access
-- Drop and recreate with collaborator support

DROP POLICY IF EXISTS "Users can manage units in own orgs" ON amoeba_units;
CREATE POLICY "Org members can manage units" ON amoeba_units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_organizations
      WHERE amoeba_organizations.id = amoeba_units.organization_id
      AND (
        amoeba_organizations.user_id = auth.uid()
        OR amoeba_organizations.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM amoeba_collaborators
          WHERE amoeba_collaborators.organization_id = amoeba_units.organization_id
          AND amoeba_collaborators.user_id = auth.uid()
          AND amoeba_collaborators.status = 'active'
        )
      )
    )
  );

DROP POLICY IF EXISTS "Users can manage members in own orgs" ON amoeba_members;
CREATE POLICY "Org members can manage members" ON amoeba_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_units
      JOIN amoeba_organizations ON amoeba_organizations.id = amoeba_units.organization_id
      WHERE amoeba_units.id = amoeba_members.unit_id
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

DROP POLICY IF EXISTS "Users can manage revenue in own orgs" ON amoeba_revenue_items;
CREATE POLICY "Org members can manage revenue" ON amoeba_revenue_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_units
      JOIN amoeba_organizations ON amoeba_organizations.id = amoeba_units.organization_id
      WHERE amoeba_units.id = amoeba_revenue_items.unit_id
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

DROP POLICY IF EXISTS "Users can manage expenses in own orgs" ON amoeba_expense_items;
CREATE POLICY "Org members can manage expenses" ON amoeba_expense_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_units
      JOIN amoeba_organizations ON amoeba_organizations.id = amoeba_units.organization_id
      WHERE amoeba_units.id = amoeba_expense_items.unit_id
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

DROP POLICY IF EXISTS "Users can manage transactions in own orgs" ON amoeba_internal_transactions;
CREATE POLICY "Org members can manage transactions" ON amoeba_internal_transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM amoeba_units
      JOIN amoeba_organizations ON amoeba_organizations.id = amoeba_units.organization_id
      WHERE amoeba_units.id = amoeba_internal_transactions.from_unit_id
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
CREATE TRIGGER update_amoeba_collaborators_updated_at
  BEFORE UPDATE ON amoeba_collaborators
  FOR EACH ROW EXECUTE FUNCTION update_amoeba_updated_at();
