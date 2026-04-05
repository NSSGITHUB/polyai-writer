import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import { useToast } from "@/hooks/use-toast";
import { ROLE_LABELS } from "@/types/amoeba";
import type { AmoebaRole } from "@/types/amoeba";
import {
  Plus,
  Building2,
  ArrowRight,
  Trash2,
  Crown,
  Users,
  BarChart3,
  AlertTriangle,
  Check,
} from "lucide-react";

const AmoebaOrgs = () => {
  const store = useAmoebaStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteOrgId, setDeleteOrgId] = useState("");
  const [deleteOrgName, setDeleteOrgName] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgDesc, setNewOrgDesc] = useState("");

  const handleCreate = () => {
    if (!newOrgName.trim()) {
      toast({ title: "請輸入組織名稱", variant: "destructive" });
      return;
    }
    store.createOrganization({
      name: newOrgName,
      description: newOrgDesc,
      fiscal_year_start: 1,
      currency: "TWD",
    });
    toast({ title: `已建立「${newOrgName}」` });
    setCreateDialogOpen(false);
    setNewOrgName("");
    setNewOrgDesc("");
  };

  const handleSwitch = (orgId: string) => {
    store.switchOrganization(orgId);
    toast({ title: "已切換組織" });
  };

  const openDelete = (orgId: string, orgName: string) => {
    setDeleteOrgId(orgId);
    setDeleteOrgName(orgName);
    setConfirmText("");
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (confirmText !== deleteOrgName) {
      toast({ title: "名稱不符，請重新輸入", variant: "destructive" });
      return;
    }
    store.deleteOrganization(deleteOrgId);
    toast({ title: `已刪除「${deleteOrgName}」` });
    setDeleteDialogOpen(false);
  };

  const roleBadgeColor: Record<string, string> = {
    owner: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    manager: "bg-green-500/20 text-green-400 border-green-500/30",
    viewer: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <AmoebaLayout title="組織管理中心" subtitle="管理您的所有阿米巴組織">
      <div className="flex justify-end mb-6">
        <Button className="bg-gradient-primary hover:shadow-glow" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          建立新組織
        </Button>
      </div>

      {store.allOrganizations.length === 0 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">尚未加入任何組織</h3>
          <p className="text-muted-foreground mb-4">
            建立一個新組織，或等待其他使用者邀請您加入
          </p>
          <Button className="bg-gradient-primary hover:shadow-glow" onClick={() => navigate("/amoeba/setup")}>
            <Plus className="w-4 h-4 mr-2" />
            啟動導入精靈
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {store.allOrganizations.map(({ org, role }) => {
            const isCurrent = store.userContext.currentOrgId === org.id;
            return (
              <Card
                key={org.id}
                className={`p-6 bg-gradient-card backdrop-blur-sm border-primary/20 transition-all ${
                  isCurrent ? "ring-2 ring-primary/50" : "hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isCurrent ? "bg-gradient-primary" : "bg-primary/20"
                    }`}>
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{org.name}</h3>
                        {isCurrent && (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            <Check className="w-3 h-3 mr-1" />
                            目前使用
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-xs ${roleBadgeColor[role]}`}>
                          {role === "owner" && <Crown className="w-3 h-3 mr-1" />}
                          {ROLE_LABELS[role]}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {org.currency} | 年度起始 {org.fiscal_year_start} 月
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {org.description && (
                  <p className="text-sm text-muted-foreground mb-4">{org.description}</p>
                )}

                <div className="flex items-center gap-2">
                  {!isCurrent && (
                    <Button
                      size="sm"
                      className="bg-gradient-primary hover:shadow-glow"
                      onClick={() => handleSwitch(org.id)}
                    >
                      <ArrowRight className="w-4 h-4 mr-1" />
                      切換至此
                    </Button>
                  )}
                  {isCurrent && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary/30"
                      onClick={() => navigate("/amoeba")}
                    >
                      <BarChart3 className="w-4 h-4 mr-1" />
                      進入總覽
                    </Button>
                  )}
                  {role === "owner" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => openDelete(org.id, org.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>建立新組織</DialogTitle>
            <DialogDescription>
              建立一個新的阿米巴組織。您將成為該組織的擁有者。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>組織名稱 *</Label>
              <Input
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                placeholder="例如：台灣科技股份有限公司"
                className="mt-1"
              />
            </div>
            <div>
              <Label>組織描述</Label>
              <Input
                value={newOrgDesc}
                onChange={(e) => setNewOrgDesc(e.target.value)}
                placeholder="簡述組織業務"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>取消</Button>
            <Button className="bg-gradient-primary" onClick={handleCreate}>建立</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-red-500/20">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              刪除組織
            </DialogTitle>
            <DialogDescription>
              此操作將永久刪除「{deleteOrgName}」及所有相關資料。請輸入組織名稱以確認。
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label>請輸入「{deleteOrgName}」以確認</Label>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={deleteOrgName}
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>取消</Button>
            <Button
              variant="destructive"
              disabled={confirmText !== deleteOrgName}
              onClick={handleDelete}
            >
              確認刪除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AmoebaLayout>
  );
};

export default AmoebaOrgs;
