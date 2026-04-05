import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import { useToast } from "@/hooks/use-toast";
import { REVENUE_CATEGORIES, EXPENSE_CATEGORIES } from "@/types/amoeba";
import {
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import type { AmoebaRevenueItem, AmoebaExpenseItem } from "@/types/amoeba";

const AmoebaAccounting = () => {
  const store = useAmoebaStore();
  const { toast } = useToast();

  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [selectedUnit, setSelectedUnit] = useState<string>("all");

  // Revenue dialog
  const [revenueDialogOpen, setRevenueDialogOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<AmoebaRevenueItem | null>(null);
  const [revenueForm, setRevenueForm] = useState({
    unit_id: "",
    category: "產品銷售",
    description: "",
    amount: 0,
    source: "external" as "external" | "internal",
  });

  // Expense dialog
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<AmoebaExpenseItem | null>(null);
  const [expenseForm, setExpenseForm] = useState({
    unit_id: "",
    category: "原材料費",
    description: "",
    amount: 0,
    is_labor_cost: false,
    source: "external" as "external" | "internal",
  });

  const periods = useMemo(() => {
    const ps: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      ps.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return ps;
  }, []);

  const filteredRevenues = store.revenues.filter(
    (r) =>
      r.period === selectedPeriod &&
      (selectedUnit === "all" || r.unit_id === selectedUnit)
  );

  const filteredExpenses = store.expenses.filter(
    (e) =>
      e.period === selectedPeriod &&
      (selectedUnit === "all" || e.unit_id === selectedUnit)
  );

  const totalRevenue = filteredRevenues.reduce((s, r) => s + r.amount, 0);
  const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const getUnitName = (id: string) => store.units.find((u) => u.id === id)?.name || "未知";

  // Revenue CRUD
  const openNewRevenue = () => {
    setEditingRevenue(null);
    setRevenueForm({
      unit_id: selectedUnit !== "all" ? selectedUnit : store.units[0]?.id || "",
      category: "產品銷售",
      description: "",
      amount: 0,
      source: "external",
    });
    setRevenueDialogOpen(true);
  };

  const openEditRevenue = (item: AmoebaRevenueItem) => {
    setEditingRevenue(item);
    setRevenueForm({
      unit_id: item.unit_id,
      category: item.category,
      description: item.description,
      amount: item.amount,
      source: item.source,
    });
    setRevenueDialogOpen(true);
  };

  const saveRevenue = () => {
    if (!revenueForm.unit_id) {
      toast({ title: "請選擇阿米巴單位", variant: "destructive" });
      return;
    }
    if (revenueForm.amount <= 0) {
      toast({ title: "金額必須大於 0", variant: "destructive" });
      return;
    }
    if (editingRevenue) {
      store.updateRevenue(editingRevenue.id, { ...revenueForm, period: selectedPeriod });
      toast({ title: "已更新營收項目" });
    } else {
      store.addRevenue({ ...revenueForm, period: selectedPeriod });
      toast({ title: "已新增營收項目" });
    }
    setRevenueDialogOpen(false);
  };

  // Expense CRUD
  const openNewExpense = () => {
    setEditingExpense(null);
    setExpenseForm({
      unit_id: selectedUnit !== "all" ? selectedUnit : store.units[0]?.id || "",
      category: "原材料費",
      description: "",
      amount: 0,
      is_labor_cost: false,
      source: "external",
    });
    setExpenseDialogOpen(true);
  };

  const openEditExpense = (item: AmoebaExpenseItem) => {
    setEditingExpense(item);
    setExpenseForm({
      unit_id: item.unit_id,
      category: item.category,
      description: item.description,
      amount: item.amount,
      is_labor_cost: item.is_labor_cost,
      source: item.source,
    });
    setExpenseDialogOpen(true);
  };

  const saveExpense = () => {
    if (!expenseForm.unit_id) {
      toast({ title: "請選擇阿米巴單位", variant: "destructive" });
      return;
    }
    if (expenseForm.amount <= 0) {
      toast({ title: "金額必須大於 0", variant: "destructive" });
      return;
    }
    if (editingExpense) {
      store.updateExpense(editingExpense.id, { ...expenseForm, period: selectedPeriod });
      toast({ title: "已更新費用項目" });
    } else {
      store.addExpense({ ...expenseForm, period: selectedPeriod });
      toast({ title: "已新增費用項目" });
    }
    setExpenseDialogOpen(false);
  };

  return (
    <AmoebaLayout title="經營會計" subtitle="記錄各阿米巴單位的營收與費用">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
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
          <Label className="text-xs text-muted-foreground">阿米巴單位</Label>
          <Select value={selectedUnit} onValueChange={setSelectedUnit}>
            <SelectTrigger className="w-48 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部單位</SelectItem>
              {store.units.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({u.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">本期營收</p>
              <p className="text-2xl font-bold text-green-400 mt-1">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-400" />
          </div>
        </Card>
        <Card className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">本期費用</p>
              <p className="text-2xl font-bold text-red-400 mt-1">
                ${totalExpense.toLocaleString()}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-400" />
          </div>
        </Card>
        <Card className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">損益</p>
              <p className={`text-2xl font-bold mt-1 ${totalRevenue - totalExpense >= 0 ? "text-primary" : "text-red-400"}`}>
                ${(totalRevenue - totalExpense).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Tabs for Revenue / Expense */}
      <Tabs defaultValue="revenue">
        <TabsList className="mb-4">
          <TabsTrigger value="revenue">營收項目</TabsTrigger>
          <TabsTrigger value="expense">費用項目</TabsTrigger>
        </TabsList>

        {/* Revenue Tab */}
        <TabsContent value="revenue">
          <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">營收明細</h3>
              {store.canEdit && (
                <Button className="bg-gradient-primary hover:shadow-glow" size="sm" onClick={openNewRevenue}>
                  <Plus className="w-4 h-4 mr-1" />
                  新增營收
                </Button>
              )}
            </div>

            {filteredRevenues.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                本期尚無營收記錄
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/20 text-muted-foreground">
                    <th className="text-left py-3 px-3">阿米巴</th>
                    <th className="text-left py-3 px-3">類別</th>
                    <th className="text-left py-3 px-3">說明</th>
                    <th className="text-left py-3 px-3">來源</th>
                    <th className="text-right py-3 px-3">金額</th>
                    <th className="text-right py-3 px-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRevenues.map((item) => (
                    <tr key={item.id} className="border-b border-primary/5 hover:bg-primary/5">
                      <td className="py-3 px-3 font-medium">{getUnitName(item.unit_id)}</td>
                      <td className="py-3 px-3">{item.category}</td>
                      <td className="py-3 px-3 text-muted-foreground">{item.description || "-"}</td>
                      <td className="py-3 px-3">
                        <Badge variant="outline" className="text-xs">
                          {item.source === "external" ? "外部" : "內部"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right text-green-400 font-medium">
                        ${item.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditRevenue(item)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            store.deleteRevenue(item.id);
                            toast({ title: "已刪除營收項目" });
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/30 font-bold">
                    <td className="py-3 px-3" colSpan={4}>合計</td>
                    <td className="py-3 px-3 text-right text-green-400">
                      ${totalRevenue.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </Card>
        </TabsContent>

        {/* Expense Tab */}
        <TabsContent value="expense">
          <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">費用明細</h3>
              {store.canEdit && (
                <Button className="bg-gradient-primary hover:shadow-glow" size="sm" onClick={openNewExpense}>
                  <Plus className="w-4 h-4 mr-1" />
                  新增費用
                </Button>
              )}
            </div>

            {filteredExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                本期尚無費用記錄
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/20 text-muted-foreground">
                    <th className="text-left py-3 px-3">阿米巴</th>
                    <th className="text-left py-3 px-3">類別</th>
                    <th className="text-left py-3 px-3">說明</th>
                    <th className="text-left py-3 px-3">屬性</th>
                    <th className="text-right py-3 px-3">金額</th>
                    <th className="text-right py-3 px-3">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((item) => (
                    <tr key={item.id} className="border-b border-primary/5 hover:bg-primary/5">
                      <td className="py-3 px-3 font-medium">{getUnitName(item.unit_id)}</td>
                      <td className="py-3 px-3">{item.category}</td>
                      <td className="py-3 px-3 text-muted-foreground">{item.description || "-"}</td>
                      <td className="py-3 px-3">
                        <Badge
                          className={`text-xs ${
                            item.is_labor_cost
                              ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                              : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                          }`}
                        >
                          {item.is_labor_cost ? "人事費" : "營業費"}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right text-red-400 font-medium">
                        ${item.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Button variant="ghost" size="sm" onClick={() => openEditExpense(item)}>
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => {
                            store.deleteExpense(item.id);
                            toast({ title: "已刪除費用項目" });
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/30 font-bold">
                    <td className="py-3 px-3" colSpan={4}>合計</td>
                    <td className="py-3 px-3 text-right text-red-400">
                      ${totalExpense.toLocaleString()}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Revenue Dialog */}
      <Dialog open={revenueDialogOpen} onOpenChange={setRevenueDialogOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>{editingRevenue ? "編輯營收" : "新增營收"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>阿米巴單位 *</Label>
              <Select
                value={revenueForm.unit_id}
                onValueChange={(v) => setRevenueForm({ ...revenueForm, unit_id: v })}
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
                <Label>營收類別</Label>
                <Select
                  value={revenueForm.category}
                  onValueChange={(v) => setRevenueForm({ ...revenueForm, category: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REVENUE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>來源</Label>
                <Select
                  value={revenueForm.source}
                  onValueChange={(v: "external" | "internal") =>
                    setRevenueForm({ ...revenueForm, source: v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">外部營收</SelectItem>
                    <SelectItem value="internal">內部交易</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>說明</Label>
              <Input
                value={revenueForm.description}
                onChange={(e) => setRevenueForm({ ...revenueForm, description: e.target.value })}
                placeholder="營收項目說明"
                className="mt-1"
              />
            </div>
            <div>
              <Label>金額 *</Label>
              <Input
                type="number"
                value={revenueForm.amount || ""}
                onChange={(e) => setRevenueForm({ ...revenueForm, amount: Number(e.target.value) })}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevenueDialogOpen(false)}>取消</Button>
            <Button className="bg-gradient-primary" onClick={saveRevenue}>
              {editingRevenue ? "更新" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expense Dialog */}
      <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>{editingExpense ? "編輯費用" : "新增費用"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>阿米巴單位 *</Label>
              <Select
                value={expenseForm.unit_id}
                onValueChange={(v) => setExpenseForm({ ...expenseForm, unit_id: v })}
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
                <Label>費用類別</Label>
                <Select
                  value={expenseForm.category}
                  onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>來源</Label>
                <Select
                  value={expenseForm.source}
                  onValueChange={(v: "external" | "internal") =>
                    setExpenseForm({ ...expenseForm, source: v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">外部費用</SelectItem>
                    <SelectItem value="internal">內部交易</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>說明</Label>
              <Input
                value={expenseForm.description}
                onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                placeholder="費用項目說明"
                className="mt-1"
              />
            </div>
            <div>
              <Label>金額 *</Label>
              <Input
                type="number"
                value={expenseForm.amount || ""}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })}
                placeholder="0"
                className="mt-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={expenseForm.is_labor_cost}
                onCheckedChange={(v) => setExpenseForm({ ...expenseForm, is_labor_cost: v })}
              />
              <Label>此為人事費用</Label>
              <span className="text-xs text-muted-foreground">
                （人事費用不計入「附加價值」計算）
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>取消</Button>
            <Button className="bg-gradient-primary" onClick={saveExpense}>
              {editingExpense ? "更新" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AmoebaLayout>
  );
};

export default AmoebaAccounting;
