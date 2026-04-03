import { useState } from "react";
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
  Pencil,
  Trash2,
  Users,
  UserPlus,
  Building2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { AmoebaUnit, AmoebaMember } from "@/types/amoeba";

const AmoebaUnits = () => {
  const store = useAmoebaStore();
  const { toast } = useToast();

  // Unit dialog
  const [unitDialogOpen, setUnitDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<AmoebaUnit | null>(null);
  const [unitForm, setUnitForm] = useState({
    name: "",
    code: "",
    leader_name: "",
    type: "profit_center" as "profit_center" | "cost_center",
    description: "",
    parent_id: null as string | null,
  });

  // Member dialog
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<AmoebaMember | null>(null);
  const [memberUnitId, setMemberUnitId] = useState("");
  const [memberForm, setMemberForm] = useState({
    name: "",
    role: "",
    hourly_rate: 250,
    monthly_hours: 176,
  });

  // Expanded units
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedUnits(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Unit CRUD
  const openNewUnit = () => {
    setEditingUnit(null);
    const nextNum = store.units.length + 1;
    setUnitForm({
      name: "",
      code: `A${String(nextNum).padStart(3, "0")}`,
      leader_name: "",
      type: "profit_center",
      description: "",
      parent_id: null,
    });
    setUnitDialogOpen(true);
  };

  const openEditUnit = (unit: AmoebaUnit) => {
    setEditingUnit(unit);
    setUnitForm({
      name: unit.name,
      code: unit.code,
      leader_name: unit.leader_name,
      type: unit.type,
      description: unit.description,
      parent_id: unit.parent_id,
    });
    setUnitDialogOpen(true);
  };

  const saveUnit = () => {
    if (!unitForm.name.trim()) {
      toast({ title: "請輸入單位名稱", variant: "destructive" });
      return;
    }
    if (editingUnit) {
      store.updateUnit(editingUnit.id, unitForm);
      toast({ title: "已更新阿米巴單位" });
    } else {
      store.addUnit({
        organization_id: store.organization?.id || "local",
        ...unitForm,
        member_count: 0,
        is_active: true,
      });
      toast({ title: "已新增阿米巴單位" });
    }
    setUnitDialogOpen(false);
  };

  const handleDeleteUnit = (unit: AmoebaUnit) => {
    if (confirm(`確定要刪除「${unit.name}」嗎？相關的成員與資料也會一起刪除。`)) {
      store.deleteUnit(unit.id);
      toast({ title: "已刪除阿米巴單位" });
    }
  };

  // Member CRUD
  const openNewMember = (unitId: string) => {
    setEditingMember(null);
    setMemberUnitId(unitId);
    setMemberForm({ name: "", role: "", hourly_rate: 250, monthly_hours: 176 });
    setMemberDialogOpen(true);
  };

  const openEditMember = (member: AmoebaMember) => {
    setEditingMember(member);
    setMemberUnitId(member.unit_id);
    setMemberForm({
      name: member.name,
      role: member.role,
      hourly_rate: member.hourly_rate,
      monthly_hours: member.monthly_hours,
    });
    setMemberDialogOpen(true);
  };

  const saveMember = () => {
    if (!memberForm.name.trim()) {
      toast({ title: "請輸入成員姓名", variant: "destructive" });
      return;
    }
    if (editingMember) {
      store.updateMember(editingMember.id, memberForm);
      toast({ title: "已更新成員" });
    } else {
      store.addMember({
        unit_id: memberUnitId,
        ...memberForm,
        is_active: true,
      });
      // Update unit member count
      const unit = store.units.find(u => u.id === memberUnitId);
      if (unit) {
        store.updateUnit(unit.id, { member_count: unit.member_count + 1 });
      }
      toast({ title: "已新增成員" });
    }
    setMemberDialogOpen(false);
  };

  const handleDeleteMember = (member: AmoebaMember) => {
    if (confirm(`確定要移除「${member.name}」嗎？`)) {
      store.deleteMember(member.id);
      toast({ title: "已移除成員" });
    }
  };

  const getUnitMembers = (unitId: string) =>
    store.members.filter(m => m.unit_id === unitId);

  return (
    <AmoebaLayout title="組織管理" subtitle="管理阿米巴單位與成員配置">
      <div className="flex justify-end mb-6">
        <Button className="bg-gradient-primary hover:shadow-glow" onClick={openNewUnit}>
          <Plus className="w-4 h-4 mr-2" />
          新增阿米巴單位
        </Button>
      </div>

      {store.units.length === 0 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">尚未建立阿米巴單位</h3>
          <p className="text-muted-foreground mb-4">
            建立第一個阿米巴單位，開始您的經營管理之旅
          </p>
          <Button className="bg-gradient-primary hover:shadow-glow" onClick={openNewUnit}>
            <Plus className="w-4 h-4 mr-2" />
            建立第一個單位
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {store.units.map((unit) => {
            const members = getUnitMembers(unit.id);
            const isExpanded = expandedUnits.has(unit.id);
            const totalHours = members.reduce((s, m) => s + m.monthly_hours, 0);

            return (
              <Card
                key={unit.id}
                className="bg-gradient-card backdrop-blur-sm border-primary/20 overflow-hidden"
              >
                {/* Unit Header */}
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-primary/5 transition-colors"
                  onClick={() => toggleExpand(unit.id)}
                >
                  <div className="flex items-center gap-4">
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-lg">{unit.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {unit.code}
                        </Badge>
                        <Badge
                          className={`text-xs ${
                            unit.type === "profit_center"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                          }`}
                        >
                          {unit.type === "profit_center" ? "利潤中心" : "成本中心"}
                        </Badge>
                      </div>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        {unit.leader_name && <span>負責人：{unit.leader_name}</span>}
                        <span>成員：{members.length} 人</span>
                        <span>月總工時：{totalHours} hr</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => openNewMember(unit.id)}>
                      <UserPlus className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openEditUnit(unit)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteUnit(unit)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Members List */}
                {isExpanded && (
                  <div className="border-t border-primary/10 px-5 pb-4">
                    {members.length === 0 ? (
                      <div className="py-6 text-center text-muted-foreground text-sm">
                        尚未添加成員
                        <Button
                          variant="link"
                          size="sm"
                          className="ml-2"
                          onClick={() => openNewMember(unit.id)}
                        >
                          添加成員
                        </Button>
                      </div>
                    ) : (
                      <table className="w-full text-sm mt-3">
                        <thead>
                          <tr className="text-muted-foreground border-b border-primary/10">
                            <th className="text-left py-2 px-3">姓名</th>
                            <th className="text-left py-2 px-3">角色</th>
                            <th className="text-right py-2 px-3">時薪</th>
                            <th className="text-right py-2 px-3">月工時</th>
                            <th className="text-right py-2 px-3">月薪估算</th>
                            <th className="text-right py-2 px-3">操作</th>
                          </tr>
                        </thead>
                        <tbody>
                          {members.map((member) => (
                            <tr
                              key={member.id}
                              className="border-b border-primary/5 hover:bg-primary/5"
                            >
                              <td className="py-2 px-3 font-medium">{member.name}</td>
                              <td className="py-2 px-3 text-muted-foreground">{member.role}</td>
                              <td className="py-2 px-3 text-right">${member.hourly_rate}</td>
                              <td className="py-2 px-3 text-right">{member.monthly_hours} hr</td>
                              <td className="py-2 px-3 text-right text-primary">
                                ${(member.hourly_rate * member.monthly_hours).toLocaleString()}
                              </td>
                              <td className="py-2 px-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditMember(member)}
                                >
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => handleDeleteMember(member)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Unit Dialog */}
      <Dialog open={unitDialogOpen} onOpenChange={setUnitDialogOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>{editingUnit ? "編輯阿米巴單位" : "新增阿米巴單位"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>單位名稱 *</Label>
                <Input
                  value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })}
                  placeholder="例如：業務一部"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>編號</Label>
                <Input
                  value={unitForm.code}
                  onChange={(e) => setUnitForm({ ...unitForm, code: e.target.value })}
                  placeholder="A001"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>負責人</Label>
                <Input
                  value={unitForm.leader_name}
                  onChange={(e) => setUnitForm({ ...unitForm, leader_name: e.target.value })}
                  placeholder="主管姓名"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>單位類型</Label>
                <Select
                  value={unitForm.type}
                  onValueChange={(v: "profit_center" | "cost_center") =>
                    setUnitForm({ ...unitForm, type: v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profit_center">利潤中心</SelectItem>
                    <SelectItem value="cost_center">成本中心</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {store.units.length > 0 && (
              <div>
                <Label>上層阿米巴（可選）</Label>
                <Select
                  value={unitForm.parent_id || "none"}
                  onValueChange={(v) =>
                    setUnitForm({ ...unitForm, parent_id: v === "none" ? null : v })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="無" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">無（頂層單位）</SelectItem>
                    {store.units
                      .filter(u => u.id !== editingUnit?.id)
                      .map(u => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name} ({u.code})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitDialogOpen(false)}>
              取消
            </Button>
            <Button className="bg-gradient-primary" onClick={saveUnit}>
              {editingUnit ? "更新" : "建立"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Dialog */}
      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="bg-card border-primary/20">
          <DialogHeader>
            <DialogTitle>{editingMember ? "編輯成員" : "新增成員"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>姓名 *</Label>
                <Input
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  placeholder="成員姓名"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>角色/職稱</Label>
                <Input
                  value={memberForm.role}
                  onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}
                  placeholder="例如：業務經理"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>時薪（{store.organization?.currency || "TWD"}）</Label>
                <Input
                  type="number"
                  value={memberForm.hourly_rate}
                  onChange={(e) => setMemberForm({ ...memberForm, hourly_rate: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>月工時</Label>
                <Input
                  type="number"
                  value={memberForm.monthly_hours}
                  onChange={(e) => setMemberForm({ ...memberForm, monthly_hours: Number(e.target.value) })}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 text-sm text-muted-foreground">
              估算月薪：<span className="text-primary font-medium">
                ${(memberForm.hourly_rate * memberForm.monthly_hours).toLocaleString()}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberDialogOpen(false)}>
              取消
            </Button>
            <Button className="bg-gradient-primary" onClick={saveMember}>
              {editingMember ? "更新" : "新增"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AmoebaLayout>
  );
};

export default AmoebaUnits;
