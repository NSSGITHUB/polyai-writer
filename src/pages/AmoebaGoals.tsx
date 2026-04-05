import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Pencil,
  Trash2,
  Target,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { AmoebaGoal } from "@/types/amoeba";

const AmoebaGoals = () => {
  const store = useAmoebaStore();
  const { toast } = useToast();

  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AmoebaGoal | null>(null);
  const [form, setForm] = useState({
    unit_id: "",
    target_revenue: 0,
    target_expense: 0,
    target_profit: 0,
    target_hourly_efficiency: 0,
    note: "",
  });

  const periods = useMemo(() => {
    const ps: string[] = [];
    for (let i = -3; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      ps.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return ps;
  }, []);

  const periodGoals = store.goals.filter((g) => g.period === selectedPeriod);
  const getUnitName = (id: string) => store.units.find((u) => u.id === id)?.name || "未知";

  const openNew = () => {
    setEditing(null);
    const unitsWithoutGoals = store.units.filter(
      (u) => !periodGoals.some((g) => g.unit_id === u.id)
    );
    setForm({
      unit_id: unitsWithoutGoals[0]?.id || store.units[0]?.id || "",
      target_revenue: 0,
      target_expense: 0,
      target_profit: 0,
      target_hourly_efficiency: 0,
      note: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (goal: AmoebaGoal) => {
    setEditing(goal);
    setForm({
      unit_id: goal.unit_id,
      target_revenue: goal.target_revenue,
      target_expense: goal.target_expense,
      target_profit: goal.target_profit,
      target_hourly_efficiency: goal.target_hourly_efficiency,
      note: goal.note,
    });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.unit_id) {
      toast({ title: "請選擇阿米巴單位", variant: "destructive" });
      return;
    }
    if (editing) {
      store.updateGoal(editing.id, { ...form, period: selectedPeriod });
      toast({ title: "已更新目標" });
    } else {
      store.addGoal({ ...form, period: selectedPeriod });
      toast({ title: "已設定目標" });
    }
    setDialogOpen(false);
  };

  const autoCalcProfit = () => {
    setForm((prev) => ({
      ...prev,
      target_profit: prev.target_revenue - prev.target_expense,
    }));
  };

  return (
    <AmoebaLayout title="目標設定" subtitle="為各阿米巴設定經營目標，追蹤達成進度">
      {/* Filters */}
      <div className="flex items-end gap-4 mb-6">
        <div>
          <Label className="text-xs text-muted-foreground">期間</Label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {store.canEdit && <Button className="bg-gradient-primary hover:shadow-glow" onClick={openNew}>
          <Plus className="w-4 h-4 mr-2" />
          設定目標
        </Button>}
      </div>

      {/* Info */}
      <Card className="p-4 bg-primary/5 border-primary/10 mb-6">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">目標管理</p>
            <p className="text-muted-foreground leading-relaxed">
              為每個阿米巴設定月度經營目標（營收、費用、利潤、單位時間效率），系統會自動比對實際數據計算達成率。
              目標設定是阿米巴經營 PDCA 循環的重要環節。
            </p>
          </div>
        </div>
      </Card>

      {periodGoals.length === 0 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">尚未設定本期目標</h3>
          <p className="text-muted-foreground mb-4">
            點擊「設定目標」為各阿米巴建立本月的經營目標
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {periodGoals.map((goal) => {
            const report = store.getMonthlyReport(goal.unit_id, selectedPeriod);
            const actualRevenue = report?.total_revenue || 0;
            const actualExpense = report?.total_expense || 0;
            const actualProfit = report?.gross_profit || 0;
            const actualEfficiency = report?.hourly_efficiency || 0;

            const revenueRate = goal.target_revenue > 0 ? (actualRevenue / goal.target_revenue) * 100 : 0;
            const expenseRate = goal.target_expense > 0 ? (actualExpense / goal.target_expense) * 100 : 0;
            const profitRate = goal.target_profit > 0 ? (actualProfit / goal.target_profit) * 100 : 0;
            const efficiencyRate = goal.target_hourly_efficiency > 0
              ? (actualEfficiency / goal.target_hourly_efficiency) * 100
              : 0;

            return (
              <Card
                key={goal.id}
                className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20"
              >
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{getUnitName(goal.unit_id)}</h3>
                    {profitRate >= 100 ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        達標
                      </Badge>
                    ) : profitRate >= 80 ? (
                      <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        接近
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                        <TrendingDown className="w-3 h-3 mr-1" />
                        待努力
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(goal)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        store.deleteGoal(goal.id);
                        toast({ title: "已刪除目標" });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  {/* Revenue Goal */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">營收目標</span>
                      <span className={revenueRate >= 100 ? "text-green-400" : "text-foreground"}>
                        {revenueRate.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={Math.min(revenueRate, 100)} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>實際 ${actualRevenue.toLocaleString()}</span>
                      <span>目標 ${goal.target_revenue.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Expense Goal */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">費用控制</span>
                      <span className={expenseRate <= 100 ? "text-green-400" : "text-red-400"}>
                        {expenseRate.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={Math.min(expenseRate, 100)} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>實際 ${actualExpense.toLocaleString()}</span>
                      <span>上限 ${goal.target_expense.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Profit Goal */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">附加價值</span>
                      <span className={profitRate >= 100 ? "text-green-400" : "text-foreground"}>
                        {profitRate.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={Math.min(profitRate, 100)} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>實際 ${actualProfit.toLocaleString()}</span>
                      <span>目標 ${goal.target_profit.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Efficiency Goal */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">單位時間效率</span>
                      <span className={efficiencyRate >= 100 ? "text-green-400" : "text-foreground"}>
                        {efficiencyRate.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={Math.min(efficiencyRate, 100)} className="h-2 mb-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>實際 ${Math.round(actualEfficiency).toLocaleString()}</span>
                      <span>目標 ${goal.target_hourly_efficiency.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {goal.note && (
                  <p className="text-sm text-muted-foreground mt-4 pt-3 border-t border-primary/10">
                    {goal.note}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Goal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>{editing ? "編輯目標" : "設定目標"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>阿米巴單位 *</Label>
              <Select
                value={form.unit_id}
                onValueChange={(v) => setForm({ ...form, unit_id: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="選擇單位" />
                </SelectTrigger>
                <SelectContent>
                  {store.units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>目標營收</Label>
                <Input
                  type="number"
                  value={form.target_revenue || ""}
                  onChange={(e) => setForm({ ...form, target_revenue: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>費用上限</Label>
                <Input
                  type="number"
                  value={form.target_expense || ""}
                  onChange={(e) => setForm({ ...form, target_expense: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>目標附加價值</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="number"
                    value={form.target_profit || ""}
                    onChange={(e) => setForm({ ...form, target_profit: Number(e.target.value) })}
                  />
                  <Button variant="outline" size="sm" onClick={autoCalcProfit} className="shrink-0">
                    自動計算
                  </Button>
                </div>
              </div>
              <div>
                <Label>目標單位時間效率 ($/hr)</Label>
                <Input
                  type="number"
                  value={form.target_hourly_efficiency || ""}
                  onChange={(e) => setForm({ ...form, target_hourly_efficiency: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label>備註</Label>
              <Textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="目標設定的背景說明或注意事項..."
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button className="bg-gradient-primary" onClick={save}>
              {editing ? "更新" : "設定"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AmoebaLayout>
  );
};

export default AmoebaGoals;
