import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import { useToast } from "@/hooks/use-toast";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/types/amoeba";
import type { AmoebaRole } from "@/types/amoeba";
import {
  Plus,
  Users,
  UserPlus,
  Shield,
  Trash2,
  Crown,
  Mail,
  Info,
} from "lucide-react";

const AmoebaTeam = () => {
  const store = useAmoebaStore();
  const { toast } = useToast();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<AmoebaRole>("viewer");

  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingCollabId, setEditingCollabId] = useState("");
  const [editingRole, setEditingRole] = useState<AmoebaRole>("viewer");

  const roleBadgeColor: Record<string, string> = {
    owner: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    manager: "bg-green-500/20 text-green-400 border-green-500/30",
    viewer: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  const roleIcon: Record<string, React.ReactNode> = {
    owner: <Crown className="w-3 h-3" />,
    admin: <Shield className="w-3 h-3" />,
    manager: <Users className="w-3 h-3" />,
    viewer: <Users className="w-3 h-3" />,
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) {
      toast({ title: "請輸入電子郵件", variant: "destructive" });
      return;
    }
    if (!inviteName.trim()) {
      toast({ title: "請輸入姓名", variant: "destructive" });
      return;
    }
    const existing = store.collaborators.find(
      (c) => c.user_email === inviteEmail
    );
    if (existing) {
      toast({ title: "此使用者已是協作者", variant: "destructive" });
      return;
    }
    store.addCollaborator(inviteEmail, inviteName, inviteRole);
    toast({ title: `已邀請 ${inviteName} 為${ROLE_LABELS[inviteRole]}` });
    setInviteDialogOpen(false);
    setInviteEmail("");
    setInviteName("");
  };

  const openRoleEdit = (collabId: string, currentRole: AmoebaRole) => {
    setEditingCollabId(collabId);
    setEditingRole(currentRole);
    setRoleDialogOpen(true);
  };

  const saveRole = () => {
    store.updateCollaboratorRole(editingCollabId, editingRole);
    toast({ title: "已更新角色" });
    setRoleDialogOpen(false);
  };

  const handleRemove = (collabId: string, name: string) => {
    if (confirm(`確定要移除「${name}」的協作權限嗎？`)) {
      store.removeCollaborator(collabId);
      toast({ title: `已移除 ${name}` });
    }
  };

  return (
    <AmoebaLayout title="團隊協作" subtitle="管理組織成員與權限設定">
      {/* Header Actions */}
      <div className="flex justify-end mb-6">
        {store.canAdmin && (
          <Button
            className="bg-gradient-primary hover:shadow-glow"
            onClick={() => setInviteDialogOpen(true)}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            邀請協作者
          </Button>
        )}
      </div>

      {/* Role Legend */}
      <Card className="p-4 bg-primary/5 border-primary/10 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-2">角色權限說明</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {(["owner", "admin", "manager", "viewer"] as AmoebaRole[]).map((role) => (
                <div key={role} className="flex items-center gap-2 text-sm">
                  <Badge className={`text-xs ${roleBadgeColor[role]}`}>
                    {roleIcon[role]}
                    <span className="ml-1">{ROLE_LABELS[role]}</span>
                  </Badge>
                  <span className="text-muted-foreground text-xs">
                    {ROLE_DESCRIPTIONS[role]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Owner Card */}
      {store.organization && (
        <Card className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-medium">{store.userContext.userName}</p>
                <p className="text-sm text-muted-foreground">{store.userContext.userEmail}</p>
              </div>
            </div>
            <Badge className={`text-xs ${roleBadgeColor.owner}`}>
              <Crown className="w-3 h-3 mr-1" />
              {ROLE_LABELS.owner}
            </Badge>
          </div>
        </Card>
      )}

      {/* Collaborators List */}
      {store.collaborators.length === 0 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">尚未邀請協作者</h3>
          <p className="text-muted-foreground mb-4">
            邀請團隊成員共同管理阿米巴經營數據。
            不同角色擁有不同的操作權限。
          </p>
          {store.canAdmin && (
            <Button
              className="bg-gradient-primary hover:shadow-glow"
              onClick={() => setInviteDialogOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              邀請第一位成員
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {store.collaborators.map((collab) => (
            <Card
              key={collab.id}
              className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{collab.user_name}</p>
                    <p className="text-sm text-muted-foreground">{collab.user_email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      加入於 {new Date(collab.created_at).toLocaleDateString("zh-TW")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge className={`text-xs ${roleBadgeColor[collab.role]}`}>
                    {roleIcon[collab.role]}
                    <span className="ml-1">{ROLE_LABELS[collab.role]}</span>
                  </Badge>

                  {store.canAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRoleEdit(collab.id, collab.role)}
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleRemove(collab.id, collab.user_name)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Invite Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>邀請協作者</DialogTitle>
            <DialogDescription>
              邀請團隊成員加入「{store.organization?.name}」的阿米巴經營管理。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>姓名 *</Label>
              <Input
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="成員姓名"
                className="mt-1"
              />
            </div>
            <div>
              <Label>電子郵件 *</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@company.com"
                className="mt-1"
              />
            </div>
            <div>
              <Label>角色</Label>
              <Select value={inviteRole} onValueChange={(v: AmoebaRole) => setInviteRole(v)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    管理員 - 可編輯所有資料
                  </SelectItem>
                  <SelectItem value="manager">
                    經理 - 可編輯經營數據
                  </SelectItem>
                  <SelectItem value="viewer">
                    檢視者 - 唯讀
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>取消</Button>
            <Button className="bg-gradient-primary" onClick={handleInvite}>
              發送邀請
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Role Edit Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>變更角色</DialogTitle>
          </DialogHeader>
          <div>
            <Label>新角色</Label>
            <Select value={editingRole} onValueChange={(v: AmoebaRole) => setEditingRole(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">管理員</SelectItem>
                <SelectItem value="manager">經理</SelectItem>
                <SelectItem value="viewer">檢視者</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleDialogOpen(false)}>取消</Button>
            <Button className="bg-gradient-primary" onClick={saveRole}>確認</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AmoebaLayout>
  );
};

export default AmoebaTeam;
