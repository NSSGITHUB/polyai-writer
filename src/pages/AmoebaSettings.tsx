import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import { useToast } from "@/hooks/use-toast";
import {
  Save,
  Trash2,
  AlertTriangle,
  Building2,
  Info,
} from "lucide-react";

const AmoebaSettings = () => {
  const store = useAmoebaStore();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resetDialogOpen, setResetDialogOpen] = useState(false);

  const [name, setName] = useState(store.organization?.name || "");
  const [description, setDescription] = useState(store.organization?.description || "");
  const [currency, setCurrency] = useState(store.organization?.currency || "TWD");
  const [fiscalYearStart, setFiscalYearStart] = useState(
    String(store.organization?.fiscal_year_start || 1)
  );

  const handleSave = () => {
    if (!name.trim()) {
      toast({ title: "請輸入組織名稱", variant: "destructive" });
      return;
    }
    store.updateOrganization({
      name,
      description,
      currency,
      fiscal_year_start: Number(fiscalYearStart),
    });
    toast({ title: "設定已儲存" });
  };

  const handleReset = () => {
    store.resetStore();
    toast({ title: "所有資料已清除" });
    setResetDialogOpen(false);
    navigate("/amoeba/setup");
  };

  if (!store.organization) {
    navigate("/amoeba");
    return null;
  }

  return (
    <AmoebaLayout title="系統設定" subtitle="管理阿米巴組織的基本設定">
      <div className="max-w-2xl space-y-6">
        {/* Organization Settings */}
        <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">組織設定</h3>
          </div>

          <div className="space-y-5">
            <div>
              <Label>組織名稱</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>組織描述</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>幣別</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TWD">新台幣 (TWD)</SelectItem>
                    <SelectItem value="USD">美元 (USD)</SelectItem>
                    <SelectItem value="JPY">日圓 (JPY)</SelectItem>
                    <SelectItem value="CNY">人民幣 (CNY)</SelectItem>
                    <SelectItem value="EUR">歐元 (EUR)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>會計年度起始月</Label>
                <Select value={fiscalYearStart} onValueChange={setFiscalYearStart}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {i + 1} 月
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {store.canAdmin && (
              <Button className="bg-gradient-primary hover:shadow-glow" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                儲存設定
              </Button>
            )}
          </div>
        </Card>

        {/* Data Summary */}
        <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
          <div className="flex items-center gap-3 mb-4">
            <Info className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">資料統計</h3>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between py-2 border-b border-primary/10">
              <span className="text-muted-foreground">阿米巴單位</span>
              <span className="font-medium">{store.units.length} 個</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/10">
              <span className="text-muted-foreground">成員人數</span>
              <span className="font-medium">{store.members.length} 人</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/10">
              <span className="text-muted-foreground">營收記錄</span>
              <span className="font-medium">{store.revenues.length} 筆</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/10">
              <span className="text-muted-foreground">費用記錄</span>
              <span className="font-medium">{store.expenses.length} 筆</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/10">
              <span className="text-muted-foreground">內部交易</span>
              <span className="font-medium">{store.transactions.length} 筆</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/10">
              <span className="text-muted-foreground">目標設定</span>
              <span className="font-medium">{store.goals.length} 筆</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/10">
              <span className="text-muted-foreground">預算項目</span>
              <span className="font-medium">{store.budgets.length} 筆</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/10">
              <span className="text-muted-foreground">協作者</span>
              <span className="font-medium">{store.collaborators.length} 人</span>
            </div>
            <div className="flex justify-between py-2 border-b border-primary/10">
              <span className="text-muted-foreground">操作日誌</span>
              <span className="font-medium">{store.activityLog.length} 筆</span>
            </div>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 bg-red-500/5 border-red-500/20">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <h3 className="text-lg font-semibold text-red-400">危險區域</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            重置將清除所有阿米巴相關資料，包括組織設定、單位、成員、營收、費用及內部交易記錄。此操作無法復原。
          </p>
          <Button
            variant="destructive"
            onClick={() => setResetDialogOpen(true)}
            disabled={!store.isOwner}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            重置所有資料
          </Button>
        </Card>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="bg-card border-red-500/20">
          <DialogHeader>
            <DialogTitle className="text-red-400">確認重置</DialogTitle>
            <DialogDescription>
              此操作將永久刪除所有阿米巴經營資料，包括：
              {store.units.length} 個單位、
              {store.members.length} 位成員、
              {store.revenues.length + store.expenses.length} 筆會計記錄。
              此操作無法復原，確定要繼續嗎？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>取消</Button>
            <Button variant="destructive" onClick={handleReset}>
              確認重置
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AmoebaLayout>
  );
};

export default AmoebaSettings;
