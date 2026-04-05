import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  ArrowLeftRight,
  ArrowRight,
  Check,
  X,
  Trash2,
} from "lucide-react";
import type { AmoebaInternalTransaction } from "@/types/amoeba";

const AmoebaTransfers = () => {
  const store = useAmoebaStore();
  const { toast } = useToast();

  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    from_unit_id: "",
    to_unit_id: "",
    description: "",
    amount: 0,
  });

  const periods = useMemo(() => {
    const ps: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      ps.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return ps;
  }, []);

  const filteredTransactions = store.transactions.filter(
    (t) => t.period === selectedPeriod
  );

  const getUnitName = (id: string) => store.units.find((u) => u.id === id)?.name || "未知";

  const openNew = () => {
    setForm({
      from_unit_id: store.units[0]?.id || "",
      to_unit_id: store.units[1]?.id || "",
      description: "",
      amount: 0,
    });
    setDialogOpen(true);
  };

  const saveTransaction = () => {
    if (!form.from_unit_id || !form.to_unit_id) {
      toast({ title: "請選擇交易雙方", variant: "destructive" });
      return;
    }
    if (form.from_unit_id === form.to_unit_id) {
      toast({ title: "提供方與接收方不能相同", variant: "destructive" });
      return;
    }
    if (form.amount <= 0) {
      toast({ title: "金額必須大於 0", variant: "destructive" });
      return;
    }

    store.addTransaction({
      from_unit_id: form.from_unit_id,
      to_unit_id: form.to_unit_id,
      period: selectedPeriod,
      description: form.description,
      amount: form.amount,
      status: "pending",
    });

    toast({ title: "已建立內部交易" });
    setDialogOpen(false);
  };

  const confirmTransaction = (tx: AmoebaInternalTransaction) => {
    store.updateTransaction(tx.id, { status: "confirmed" });

    // Auto-create revenue for the providing unit
    store.addRevenue({
      unit_id: tx.from_unit_id,
      period: tx.period,
      category: "內部服務",
      description: `內部交易：提供服務予 ${getUnitName(tx.to_unit_id)} - ${tx.description}`,
      amount: tx.amount,
      source: "internal",
      related_transaction_id: tx.id,
    });

    // Auto-create expense for the receiving unit
    store.addExpense({
      unit_id: tx.to_unit_id,
      period: tx.period,
      category: "外包費用",
      description: `內部交易：接收來自 ${getUnitName(tx.from_unit_id)} 的服務 - ${tx.description}`,
      amount: tx.amount,
      is_labor_cost: false,
      source: "internal",
      related_transaction_id: tx.id,
    });

    toast({ title: "交易已確認，營收與費用已自動產生" });
  };

  const rejectTransaction = (tx: AmoebaInternalTransaction) => {
    store.updateTransaction(tx.id, { status: "rejected" });
    toast({ title: "交易已駁回" });
  };

  const statusConfig = {
    pending: { label: "待確認", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    confirmed: { label: "已確認", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    rejected: { label: "已駁回", className: "bg-red-500/20 text-red-400 border-red-500/30" },
  };

  return (
    <AmoebaLayout title="內部交易" subtitle="管理阿米巴單位之間的內部定價與交易">
      {/* Filter */}
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
        {store.canEdit && (
          <Button className="bg-gradient-primary hover:shadow-glow" onClick={openNew}>
            <Plus className="w-4 h-4 mr-2" />
            新增內部交易
          </Button>
        )}
      </div>

      {/* Info Box */}
      <Card className="p-4 bg-primary/5 border-primary/10 mb-6">
        <div className="flex items-start gap-3">
          <ArrowLeftRight className="w-5 h-5 text-primary mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">什麼是內部交易？</p>
            <p className="text-muted-foreground leading-relaxed">
              阿米巴經營的核心機制之一。當一個阿米巴為另一個阿米巴提供服務或產品時，
              需透過「內部定價」進行交易。提供方記錄為營收，接收方記錄為費用。
              確認交易後，系統會自動在經營會計中產生對應的營收與費用記錄。
            </p>
          </div>
        </div>
      </Card>

      {store.units.length < 2 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <ArrowLeftRight className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">至少需要 2 個阿米巴單位</h3>
          <p className="text-muted-foreground">
            請先在「組織管理」中建立至少 2 個阿米巴單位，才能進行內部交易
          </p>
        </Card>
      ) : filteredTransactions.length === 0 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <ArrowLeftRight className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">本期尚無內部交易</h3>
          <p className="text-muted-foreground mb-4">
            點擊「新增內部交易」開始記錄阿米巴之間的服務與產品交換
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTransactions.map((tx) => {
            const sc = statusConfig[tx.status];
            return (
              <Card
                key={tx.id}
                className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium">{getUnitName(tx.from_unit_id)}</p>
                      <p className="text-xs text-muted-foreground">提供方</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary" />
                    <div className="text-center">
                      <p className="text-sm font-medium">{getUnitName(tx.to_unit_id)}</p>
                      <p className="text-xs text-muted-foreground">接收方</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">
                        ${tx.amount.toLocaleString()}
                      </p>
                      {tx.description && (
                        <p className="text-xs text-muted-foreground">{tx.description}</p>
                      )}
                    </div>

                    <Badge className={`text-xs ${sc.className}`}>{sc.label}</Badge>

                    {tx.status === "pending" && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-green-400 hover:text-green-300"
                          onClick={() => confirmTransaction(tx)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => rejectTransaction(tx)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => {
                        store.deleteTransaction(tx.id);
                        toast({ title: "已刪除交易" });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* New Transaction Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>新增內部交易</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>提供方（記營收）*</Label>
                <Select
                  value={form.from_unit_id}
                  onValueChange={(v) => setForm({ ...form, from_unit_id: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="選擇提供方" />
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
              <div>
                <Label>接收方（記費用）*</Label>
                <Select
                  value={form.to_unit_id}
                  onValueChange={(v) => setForm({ ...form, to_unit_id: v })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="選擇接收方" />
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
            </div>
            <div>
              <Label>交易說明</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="例如：IT 系統維護服務"
                className="mt-1"
              />
            </div>
            <div>
              <Label>交易金額 *</Label>
              <Input
                type="number"
                value={form.amount || ""}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                placeholder="0"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button className="bg-gradient-primary" onClick={saveTransaction}>
              建立交易
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AmoebaLayout>
  );
};

export default AmoebaTransfers;
