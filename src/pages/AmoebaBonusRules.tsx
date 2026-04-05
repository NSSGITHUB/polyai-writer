import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import { useToast } from "@/hooks/use-toast";
import {
  BONUS_METHOD_LABELS,
  BONUS_METHOD_DESCRIPTIONS,
} from "@/types/amoeba";
import type { AmoebaBonusRule, BonusCalcMethod, EfficiencyTier } from "@/types/amoeba";
import {
  Plus,
  Pencil,
  Trash2,
  Trophy,
  Info,
  Star,
} from "lucide-react";

const defaultTiers: EfficiencyTier[] = [
  { min_efficiency: 0, max_efficiency: 200, multiplier: 0, label: "未達標" },
  { min_efficiency: 200, max_efficiency: 400, multiplier: 0.05, label: "基礎" },
  { min_efficiency: 400, max_efficiency: 600, multiplier: 0.1, label: "良好" },
  { min_efficiency: 600, max_efficiency: 800, multiplier: 0.15, label: "優秀" },
  { min_efficiency: 800, max_efficiency: 0, multiplier: 0.25, label: "卓越" },
];

const emptyRule = (): Omit<AmoebaBonusRule, "id" | "created_at"> => ({
  name: "",
  method: "profit_ratio",
  is_active: true,
  profit_share_percent: 10,
  efficiency_tiers: defaultTiers,
  achievement_base_percent: 10,
  achievement_exceed_bonus: 0.5,
  achievement_min_threshold: 60,
  fixed_pool_amount: 100000,
});

const AmoebaBonusRules = () => {
  const store = useAmoebaStore();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AmoebaBonusRule | null>(null);
  const [form, setForm] = useState(emptyRule());

  const openNew = () => {
    setEditing(null);
    setForm(emptyRule());
    setDialogOpen(true);
  };

  const openEdit = (rule: AmoebaBonusRule) => {
    setEditing(rule);
    setForm({
      name: rule.name,
      method: rule.method,
      is_active: rule.is_active,
      profit_share_percent: rule.profit_share_percent,
      efficiency_tiers: rule.efficiency_tiers?.length ? rule.efficiency_tiers : defaultTiers,
      achievement_base_percent: rule.achievement_base_percent,
      achievement_exceed_bonus: rule.achievement_exceed_bonus,
      achievement_min_threshold: rule.achievement_min_threshold,
      fixed_pool_amount: rule.fixed_pool_amount,
    });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) {
      toast({ title: "請輸入規則名稱", variant: "destructive" });
      return;
    }
    if (editing) {
      store.updateBonusRule(editing.id, form);
      toast({ title: "已更新獎金規則" });
    } else {
      store.addBonusRule(form);
      toast({ title: "已新增獎金規則" });
    }
    setDialogOpen(false);
  };

  const updateTier = (idx: number, field: keyof EfficiencyTier, value: string | number) => {
    const newTiers = [...form.efficiency_tiers];
    newTiers[idx] = { ...newTiers[idx], [field]: value };
    setForm({ ...form, efficiency_tiers: newTiers });
  };

  const addTier = () => {
    setForm({
      ...form,
      efficiency_tiers: [
        ...form.efficiency_tiers,
        { min_efficiency: 0, max_efficiency: 0, multiplier: 0, label: "" },
      ],
    });
  };

  const removeTier = (idx: number) => {
    setForm({
      ...form,
      efficiency_tiers: form.efficiency_tiers.filter((_, i) => i !== idx),
    });
  };

  const methodBadgeColor: Record<BonusCalcMethod, string> = {
    profit_ratio: "bg-green-500/20 text-green-400 border-green-500/30",
    efficiency_tier: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    goal_achievement: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    fixed_pool_split: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  };

  return (
    <AmoebaLayout title="績效獎金規則" subtitle="設定獎金計算方式與分配規則">
      <div className="flex justify-end mb-6">
        {store.canAdmin && (
          <Button className="bg-gradient-primary hover:shadow-glow" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            新增獎金規則
          </Button>
        )}
      </div>

      {/* Method Legend */}
      <Card className="p-4 bg-primary/5 border-primary/10 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium mb-2">四種獎金計算方式</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(Object.keys(BONUS_METHOD_LABELS) as BonusCalcMethod[]).map((method) => (
                <div key={method} className="text-sm">
                  <Badge className={`text-xs ${methodBadgeColor[method]}`}>
                    {BONUS_METHOD_LABELS[method]}
                  </Badge>
                  <span className="text-muted-foreground text-xs ml-2">
                    {BONUS_METHOD_DESCRIPTIONS[method]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Rules List */}
      {store.bonusRules.length === 0 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">尚未設定獎金規則</h3>
          <p className="text-muted-foreground mb-4">
            建立獎金規則後，系統將自動依據經營數據計算每位成員的績效獎金
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {store.bonusRules.map((rule) => (
            <Card
              key={rule.id}
              className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <Star className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{rule.name}</h3>
                      <Badge className={`text-xs ${methodBadgeColor[rule.method]}`}>
                        {BONUS_METHOD_LABELS[rule.method]}
                      </Badge>
                      {rule.is_active ? (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">啟用中</Badge>
                      ) : (
                        <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">停用</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {BONUS_METHOD_DESCRIPTIONS[rule.method]}
                    </p>
                  </div>
                </div>

                {store.canAdmin && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`確定要刪除「${rule.name}」嗎？`)) {
                          store.deleteBonusRule(rule.id);
                          toast({ title: "已刪除獎金規則" });
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Rule Details */}
              <div className="bg-background/30 rounded-lg p-4 text-sm">
                {rule.method === "profit_ratio" && (
                  <p>利潤提撥比例：<strong className="text-primary">{rule.profit_share_percent}%</strong> 的附加價值作為獎金，依成員工時佔比分配</p>
                )}
                {rule.method === "efficiency_tier" && (
                  <div>
                    <p className="mb-2">效率級距與獎金乘數：</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      {(rule.efficiency_tiers || []).map((t, i) => (
                        <div key={i} className="p-2 bg-primary/5 rounded text-center">
                          <p className="font-medium text-xs">{t.label}</p>
                          <p className="text-xs text-muted-foreground">
                            ${t.min_efficiency}~{t.max_efficiency === 0 ? "∞" : `$${t.max_efficiency}`}/hr
                          </p>
                          <p className="text-primary font-bold">{(t.multiplier * 100).toFixed(0)}%</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {rule.method === "goal_achievement" && (
                  <div className="space-y-1">
                    <p>基礎獎金（100%達成）：月薪 × <strong className="text-primary">{rule.achievement_base_percent}%</strong></p>
                    <p>超額獎勵：每超標 1% 額外 <strong className="text-primary">{rule.achievement_exceed_bonus}%</strong> 月薪</p>
                    <p>最低門檻：達成率須 ≥ <strong className="text-primary">{rule.achievement_min_threshold}%</strong> 才發放</p>
                  </div>
                )}
                {rule.method === "fixed_pool_split" && (
                  <p>每月獎金池：<strong className="text-primary">${rule.fixed_pool_amount.toLocaleString()}</strong>，依各單位附加價值佔比分配</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Rule Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-primary/20 max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "編輯獎金規則" : "新增獎金規則"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>規則名稱 *</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="例如：月度績效獎金"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>計算方式</Label>
                <Select
                  value={form.method}
                  onValueChange={(v: BonusCalcMethod) => setForm({ ...form, method: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(BONUS_METHOD_LABELS) as BonusCalcMethod[]).map((m) => (
                      <SelectItem key={m} value={m}>
                        {BONUS_METHOD_LABELS[m]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm({ ...form, is_active: v })}
              />
              <Label>啟用此規則</Label>
            </div>

            {/* Method-specific fields */}
            {form.method === "profit_ratio" && (
              <Card className="p-4 border-primary/10">
                <h4 className="text-sm font-medium mb-3">利潤提撥制設定</h4>
                <div>
                  <Label>提撥比例 (%)</Label>
                  <Input
                    type="number"
                    value={form.profit_share_percent}
                    onChange={(e) => setForm({ ...form, profit_share_percent: Number(e.target.value) })}
                    className="mt-1 w-32"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    從單位附加價值中提撥的百分比，再依成員工時佔比分配
                  </p>
                </div>
              </Card>
            )}

            {form.method === "efficiency_tier" && (
              <Card className="p-4 border-primary/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">效率分級制設定</h4>
                  <Button variant="outline" size="sm" onClick={addTier}>
                    <Plus className="w-3 h-3 mr-1" />
                    新增級距
                  </Button>
                </div>
                <div className="space-y-2">
                  {form.efficiency_tiers.map((tier, idx) => (
                    <div key={idx} className="grid grid-cols-5 gap-2 items-end">
                      <div>
                        <Label className="text-xs">級距名稱</Label>
                        <Input
                          value={tier.label}
                          onChange={(e) => updateTier(idx, "label", e.target.value)}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">最低效率</Label>
                        <Input
                          type="number"
                          value={tier.min_efficiency}
                          onChange={(e) => updateTier(idx, "min_efficiency", Number(e.target.value))}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">最高效率 (0=∞)</Label>
                        <Input
                          type="number"
                          value={tier.max_efficiency}
                          onChange={(e) => updateTier(idx, "max_efficiency", Number(e.target.value))}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">獎金乘數</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={tier.multiplier}
                          onChange={(e) => updateTier(idx, "multiplier", Number(e.target.value))}
                          className="mt-1 h-8 text-sm"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive h-8"
                        onClick={() => removeTier(idx)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  獎金 = 基本月薪 × 對應級距的獎金乘數
                </p>
              </Card>
            )}

            {form.method === "goal_achievement" && (
              <Card className="p-4 border-primary/10">
                <h4 className="text-sm font-medium mb-3">目標達成制設定</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-xs">基礎獎金比 (%)</Label>
                    <Input
                      type="number"
                      value={form.achievement_base_percent}
                      onChange={(e) => setForm({ ...form, achievement_base_percent: Number(e.target.value) })}
                      className="mt-1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">達成100%時的獎金比例</p>
                  </div>
                  <div>
                    <Label className="text-xs">超額獎勵 (%/1%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={form.achievement_exceed_bonus}
                      onChange={(e) => setForm({ ...form, achievement_exceed_bonus: Number(e.target.value) })}
                      className="mt-1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">每超標1%額外比例</p>
                  </div>
                  <div>
                    <Label className="text-xs">最低門檻 (%)</Label>
                    <Input
                      type="number"
                      value={form.achievement_min_threshold}
                      onChange={(e) => setForm({ ...form, achievement_min_threshold: Number(e.target.value) })}
                      className="mt-1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">低於此不發放</p>
                  </div>
                </div>
              </Card>
            )}

            {form.method === "fixed_pool_split" && (
              <Card className="p-4 border-primary/10">
                <h4 className="text-sm font-medium mb-3">獎金池均分制設定</h4>
                <div>
                  <Label>每月獎金池金額</Label>
                  <Input
                    type="number"
                    value={form.fixed_pool_amount}
                    onChange={(e) => setForm({ ...form, fixed_pool_amount: Number(e.target.value) })}
                    className="mt-1 w-48"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    固定金額依各單位附加價值貢獻佔比分配，再依成員工時佔比細分
                  </p>
                </div>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button className="bg-gradient-primary" onClick={save}>
              {editing ? "更新" : "建立"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AmoebaLayout>
  );
};

export default AmoebaBonusRules;
