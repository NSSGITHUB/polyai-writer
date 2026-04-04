import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import { useToast } from "@/hooks/use-toast";
import { REVENUE_CATEGORIES, EXPENSE_CATEGORIES } from "@/types/amoeba";
import {
  Plus,
  Pencil,
  Trash2,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { AmoebaBudget } from "@/types/amoeba";

const AmoebaBudgets = () => {
  const store = useAmoebaStore();
  const { toast } = useToast();

  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [selectedUnit, setSelectedUnit] = useState<string>("all");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AmoebaBudget | null>(null);
  const [form, setForm] = useState({
    unit_id: "",
    category: "",
    budget_type: "revenue" as "revenue" | "expense",
    planned_amount: 0,
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

  const filteredBudgets = store.budgets.filter(
    (b) =>
      b.period === selectedPeriod &&
      (selectedUnit === "all" || b.unit_id === selectedUnit)
  );

  const revenueBudgets = filteredBudgets.filter((b) => b.budget_type === "revenue");
  const expenseBudgets = filteredBudgets.filter((b) => b.budget_type === "expense");

  const totalPlannedRevenue = revenueBudgets.reduce((s, b) => s + b.planned_amount, 0);
  const totalPlannedExpense = expenseBudgets.reduce((s, b) => s + b.planned_amount, 0);

  // Actual amounts for comparison
  const getActualForCategory = (unitId: string, category: string, type: "revenue" | "expense") => {
    if (type === "revenue") {
      return store.revenues
        .filter((r) => r.unit_id === unitId && r.period === selectedPeriod && r.category === category)
        .reduce((s, r) => s + r.amount, 0);
    }
    return store.expenses
      .filter((e) => e.unit_id === unitId && e.period === selectedPeriod && e.category === category)
      .reduce((s, e) => s + e.amount, 0);
  };

  const getUnitName = (id: string) => store.units.find((u) => u.id === id)?.name || "未知";

  // Chart data: per-unit budget vs actual
  const chartData = useMemo(() => {
    const unitIds = selectedUnit === "all"
      ? [...new Set(filteredBudgets.map((b) => b.unit_id))]
      : [selectedUnit];

    return unitIds.map((uid) => {
      const unitBudgetsRev = revenueBudgets.filter((b) => b.unit_id === uid);
      const unitBudgetsExp = expenseBudgets.filter((b) => b.unit_id === uid);
      const plannedRev = unitBudgetsRev.reduce((s, b) => s + b.planned_amount, 0);
      const plannedExp = unitBudgetsExp.reduce((s, b) => s + b.planned_amount, 0);

      const actualRev = store.revenues
        .filter((r) => r.unit_id === uid && r.period === selectedPeriod)
        .reduce((s, r) => s + r.amount, 0);
      const actualExp = store.expenses
        .filter((e) => e.unit_id === uid && e.period === selectedPeriod)
        .reduce((s, e) => s + e.amount, 0);

      return {
        name: getUnitName(uid),
        預算營收: plannedRev,
        實際營收: actualRev,
        預算費用: plannedExp,
        實際費用: actualExp,
      };
    });
  }, [filteredBudgets, store.revenues, store.expenses, selectedPeriod, selectedUnit]);

  const openNew = (type: "revenue" | "expense") => {
    setEditing(null);
    setForm({
      unit_id: selectedUnit !== "all" ? selectedUnit : store.units[0]?.id || "",
      category: type === "revenue" ? "產品銷售" : "原材料費",
      budget_type: type,
      planned_amount: 0,
      note: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (budget: AmoebaBudget) => {
    setEditing(budget);
    setForm({
      unit_id: budget.unit_id,
      category: budget.category,
      budget_type: budget.budget_type,
      planned_amount: budget.planned_amount,
      note: budget.note,
    });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.unit_id) {
      toast({ title: "請選擇阿米巴單位", variant: "destructive" });
      return;
    }
    if (form.planned_amount <= 0) {
      toast({ title: "預算金額必須大於 0", variant: "destructive" });
      return;
    }
    if (editing) {
      store.updateBudget(editing.id, { ...form, period: selectedPeriod });
      toast({ title: "已更新預算" });
    } else {
      store.addBudget({ ...form, period: selectedPeriod });
      toast({ title: "已新增預算" });
    }
    setDialogOpen(false);
  };

  const renderBudgetTable = (budgets: AmoebaBudget[], type: "revenue" | "expense") => {
    if (budgets.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-sm">
          尚無{type === "revenue" ? "營收" : "費用"}預算記錄
        </div>
      );
    }

    return (
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-primary/20 text-muted-foreground">
            <th className="text-left py-3 px-3">阿米巴</th>
            <th className="text-left py-3 px-3">類別</th>
            <th className="text-right py-3 px-3">預算金額</th>
            <th className="text-right py-3 px-3">實際金額</th>
            <th className="text-right py-3 px-3">執行率</th>
            <th className="text-left py-3 px-3">狀態</th>
            <th className="text-right py-3 px-3">操作</th>
          </tr>
        </thead>
        <tbody>
          {budgets.map((b) => {
            const actual = getActualForCategory(b.unit_id, b.category, type);
            const rate = b.planned_amount > 0 ? (actual / b.planned_amount) * 100 : 0;
            const isOver = type === "expense" ? rate > 100 : false;
            const isGood = type === "revenue" ? rate >= 100 : rate <= 100;

            return (
              <tr key={b.id} className="border-b border-primary/5 hover:bg-primary/5">
                <td className="py-3 px-3 font-medium">{getUnitName(b.unit_id)}</td>
                <td className="py-3 px-3">{b.category}</td>
                <td className="py-3 px-3 text-right">${b.planned_amount.toLocaleString()}</td>
                <td className={`py-3 px-3 text-right font-medium ${type === "revenue" ? "text-green-400" : "text-red-400"}`}>
                  ${actual.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Progress value={Math.min(rate, 100)} className="w-16 h-2" />
                    <span className="text-xs w-12 text-right">{rate.toFixed(0)}%</span>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <Badge
                    className={`text-xs ${
                      isGood
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : isOver
                        ? "bg-red-500/20 text-red-400 border-red-500/30"
                        : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    }`}
                  >
                    {isGood ? "正常" : isOver ? "超支" : "進行中"}
                  </Badge>
                </td>
                <td className="py-3 px-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(b)}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => {
                      store.deleteBudget(b.id);
                      toast({ title: "已刪除預算" });
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-primary/30 font-bold">
            <td className="py-3 px-3" colSpan={2}>合計</td>
            <td className="py-3 px-3 text-right">
              ${budgets.reduce((s, b) => s + b.planned_amount, 0).toLocaleString()}
            </td>
            <td className={`py-3 px-3 text-right ${type === "revenue" ? "text-green-400" : "text-red-400"}`}>
              ${budgets.reduce((s, b) => s + getActualForCategory(b.unit_id, b.category, type), 0).toLocaleString()}
            </td>
            <td colSpan={3}></td>
          </tr>
        </tfoot>
      </table>
    );
  };

  return (
    <AmoebaLayout title="預算管理" subtitle="編列與追蹤各阿米巴的收支預算">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
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
        <div>
          <Label className="text-xs text-muted-foreground">阿米巴</Label>
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="w-48 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部單位</SelectItem>
              {store.units.map((u) => (
                <SelectItem key={u.id} value={u.id}>{u.name} ({u.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">預算營收</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                ${totalPlannedRevenue.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">預算費用</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                ${totalPlannedExpense.toLocaleString()}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
        </Card>
        <Card className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">預算損益</p>
              <p className={`text-2xl font-bold mt-1 ${totalPlannedRevenue - totalPlannedExpense >= 0 ? "text-primary" : "text-red-400"}`}>
                ${(totalPlannedRevenue - totalPlannedExpense).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Budget vs Actual Chart */}
      {chartData.length > 0 && (
        <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20 mb-6">
          <h3 className="text-lg font-semibold mb-4">預算 vs 實際對比</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
                <XAxis dataKey="name" stroke="hsl(240 5% 65%)" fontSize={12} />
                <YAxis stroke="hsl(240 5% 65%)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(240 6% 10%)",
                    border: "1px solid hsl(263 70% 50% / 0.3)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="預算營收" fill="#4ade80" opacity={0.5} radius={[4, 4, 0, 0]} />
                <Bar dataKey="實際營收" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="預算費用" fill="#f87171" opacity={0.5} radius={[4, 4, 0, 0]} />
                <Bar dataKey="實際費用" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Budget Tables */}
      <Tabs defaultValue="revenue">
        <TabsList className="mb-4">
          <TabsTrigger value="revenue">營收預算</TabsTrigger>
          <TabsTrigger value="expense">費用預算</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue">
          <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">營收預算明細</h3>
              <Button className="bg-gradient-primary hover:shadow-glow" size="sm" onClick={() => openNew("revenue")}>
                <Plus className="w-4 h-4 mr-1" />
                新增營收預算
              </Button>
            </div>
            {renderBudgetTable(revenueBudgets, "revenue")}
          </Card>
        </TabsContent>

        <TabsContent value="expense">
          <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">費用預算明細</h3>
              <Button className="bg-gradient-primary hover:shadow-glow" size="sm" onClick={() => openNew("expense")}>
                <Plus className="w-4 h-4 mr-1" />
                新增費用預算
              </Button>
            </div>
            {renderBudgetTable(expenseBudgets, "expense")}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Budget Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>
              {editing ? "編輯預算" : `新增${form.budget_type === "revenue" ? "營收" : "費用"}預算`}
            </DialogTitle>
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
                    <SelectItem key={u.id} value={u.id}>{u.name} ({u.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>類別</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(form.budget_type === "revenue" ? [...REVENUE_CATEGORIES] : [...EXPENSE_CATEGORIES]).map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>預算金額 *</Label>
              <Input
                type="number"
                value={form.planned_amount || ""}
                onChange={(e) => setForm({ ...form, planned_amount: Number(e.target.value) })}
                className="mt-1"
              />
            </div>
            <div>
              <Label>備註</Label>
              <Input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="預算備註"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button className="bg-gradient-primary" onClick={save}>
              {editing ? "更新" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AmoebaLayout>
  );
};

export default AmoebaBudgets;
