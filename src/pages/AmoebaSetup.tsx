import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import {
  Building2,
  Users,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  Trash2,
} from "lucide-react";
import type { AmoebaUnit, AmoebaMember } from "@/types/amoeba";

const AmoebaSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const store = useAmoebaStore();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Step 1: Organization
  const [orgName, setOrgName] = useState("");
  const [orgDescription, setOrgDescription] = useState("");
  const [currency, setCurrency] = useState("TWD");
  const [fiscalYearStart, setFiscalYearStart] = useState("1");

  // Step 2: Units
  const [units, setUnits] = useState<Array<{
    name: string;
    code: string;
    leader_name: string;
    type: 'profit_center' | 'cost_center';
    description: string;
  }>>([
    { name: "", code: "A001", leader_name: "", type: "profit_center", description: "" },
  ]);

  // Step 3: Members per unit
  const [membersMap, setMembersMap] = useState<Record<number, Array<{
    name: string;
    role: string;
    hourly_rate: number;
    monthly_hours: number;
  }>>>({
    0: [{ name: "", role: "", hourly_rate: 250, monthly_hours: 176 }],
  });

  const addUnit = () => {
    const nextCode = `A${String(units.length + 1).padStart(3, "0")}`;
    setUnits([...units, { name: "", code: nextCode, leader_name: "", type: "profit_center", description: "" }]);
    setMembersMap(prev => ({ ...prev, [units.length]: [{ name: "", role: "", hourly_rate: 250, monthly_hours: 176 }] }));
  };

  const removeUnit = (idx: number) => {
    if (units.length <= 1) return;
    setUnits(units.filter((_, i) => i !== idx));
    const newMap: typeof membersMap = {};
    Object.keys(membersMap).forEach(key => {
      const k = Number(key);
      if (k < idx) newMap[k] = membersMap[k];
      else if (k > idx) newMap[k - 1] = membersMap[k];
    });
    setMembersMap(newMap);
  };

  const updateUnit = (idx: number, field: string, value: string) => {
    setUnits(units.map((u, i) => i === idx ? { ...u, [field]: value } : u));
  };

  const addMember = (unitIdx: number) => {
    setMembersMap(prev => ({
      ...prev,
      [unitIdx]: [...(prev[unitIdx] || []), { name: "", role: "", hourly_rate: 250, monthly_hours: 176 }],
    }));
  };

  const removeMember = (unitIdx: number, memberIdx: number) => {
    setMembersMap(prev => ({
      ...prev,
      [unitIdx]: (prev[unitIdx] || []).filter((_, i) => i !== memberIdx),
    }));
  };

  const updateMember = (unitIdx: number, memberIdx: number, field: string, value: string | number) => {
    setMembersMap(prev => ({
      ...prev,
      [unitIdx]: (prev[unitIdx] || []).map((m, i) =>
        i === memberIdx ? { ...m, [field]: value } : m
      ),
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!orgName.trim()) {
        toast({ title: "請輸入組織名稱", variant: "destructive" });
        return;
      }
    }
    if (step === 2) {
      const hasEmpty = units.some(u => !u.name.trim());
      if (hasEmpty) {
        toast({ title: "請填寫所有阿米巴單位名稱", variant: "destructive" });
        return;
      }
    }
    setStep(step + 1);
  };

  const handleFinish = () => {
    // Save organization
    store.setOrganization({
      name: orgName,
      description: orgDescription,
      fiscal_year_start: Number(fiscalYearStart),
      currency,
    });

    // Save units and members
    units.forEach((unit, unitIdx) => {
      const savedUnit = store.addUnit({
        organization_id: "local",
        name: unit.name,
        code: unit.code,
        parent_id: null,
        leader_name: unit.leader_name,
        type: unit.type,
        description: unit.description,
        member_count: (membersMap[unitIdx] || []).filter(m => m.name.trim()).length,
        is_active: true,
      });

      (membersMap[unitIdx] || []).forEach(member => {
        if (member.name.trim()) {
          store.addMember({
            unit_id: savedUnit.id,
            name: member.name,
            role: member.role,
            hourly_rate: member.hourly_rate,
            monthly_hours: member.monthly_hours,
            is_active: true,
          });
        }
      });
    });

    toast({ title: "設定完成！", description: "您的阿米巴組織已建立成功" });
    navigate("/amoeba");
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-primary mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">阿米巴經營導入精靈</h1>
          <p className="text-muted-foreground">
            只需 3 個步驟，輕鬆建立您的阿米巴經營體系
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  s < step
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : s === step
                    ? "bg-primary/20 text-primary border border-primary/50"
                    : "bg-muted/30 text-muted-foreground border border-muted/30"
                }`}
              >
                {s < step ? <Check className="w-5 h-5" /> : s}
              </div>
              <span
                className={`text-sm hidden sm:block ${
                  s === step ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
              >
                {s === 1 ? "組織資訊" : s === 2 ? "建立單位" : "配置成員"}
              </span>
              {s < 3 && <div className="w-12 h-px bg-muted/30 mx-2" />}
            </div>
          ))}
        </div>

        {/* Step 1: Organization Info */}
        {step === 1 && (
          <Card className="p-8 bg-gradient-card backdrop-blur-sm border-primary/20">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">步驟一：組織基本資訊</h2>
            </div>

            <div className="space-y-5">
              <div>
                <Label htmlFor="orgName">組織名稱 *</Label>
                <Input
                  id="orgName"
                  placeholder="例如：台灣科技股份有限公司"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="orgDesc">組織描述</Label>
                <Textarea
                  id="orgDesc"
                  placeholder="簡述公司業務範圍與導入阿米巴的目的..."
                  value={orgDescription}
                  onChange={(e) => setOrgDescription(e.target.value)}
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

              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                <h4 className="text-sm font-medium mb-2">什麼是阿米巴經營？</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  阿米巴經營是由京瓷創辦人稻盛和夫所提出的經營哲學。核心理念是將公司分成多個「阿米巴」小單位，
                  每個單位都作為獨立的利潤中心運作，透過「單位時間附加價值」這一核心指標，
                  讓每位員工都能成為經營者，共同參與公司的經營管理。
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Step 2: Create Units */}
        {step === 2 && (
          <Card className="p-8 bg-gradient-card backdrop-blur-sm border-primary/20">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">步驟二：建立阿米巴單位</h2>
              </div>
              <Button variant="outline" size="sm" onClick={addUnit}>
                <Plus className="w-4 h-4 mr-1" />
                新增單位
              </Button>
            </div>

            <div className="space-y-6">
              {units.map((unit, idx) => (
                <div
                  key={idx}
                  className="border border-primary/10 rounded-lg p-5 bg-background/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-primary">
                      阿米巴 #{idx + 1}
                    </span>
                    {units.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeUnit(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>單位名稱 *</Label>
                      <Input
                        placeholder="例如：業務一部"
                        value={unit.name}
                        onChange={(e) => updateUnit(idx, "name", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>編號</Label>
                      <Input
                        placeholder="A001"
                        value={unit.code}
                        onChange={(e) => updateUnit(idx, "code", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>負責人</Label>
                      <Input
                        placeholder="部門主管姓名"
                        value={unit.leader_name}
                        onChange={(e) => updateUnit(idx, "leader_name", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>單位類型</Label>
                      <Select
                        value={unit.type}
                        onValueChange={(v) => updateUnit(idx, "type", v)}
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
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Step 3: Add Members */}
        {step === 3 && (
          <Card className="p-8 bg-gradient-card backdrop-blur-sm border-primary/20 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-semibold">步驟三：配置成員</h2>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              為每個阿米巴單位添加成員。工時與時薪將用於計算「單位時間附加價值」。
            </p>

            <div className="space-y-8">
              {units.map((unit, unitIdx) => (
                <div key={unitIdx}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-primary">
                      {unit.name || `阿米巴 #${unitIdx + 1}`}
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => addMember(unitIdx)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      新增成員
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {(membersMap[unitIdx] || []).map((member, memberIdx) => (
                      <div
                        key={memberIdx}
                        className="grid grid-cols-5 gap-3 items-end border border-primary/10 rounded-lg p-3 bg-background/30"
                      >
                        <div>
                          <Label className="text-xs">姓名</Label>
                          <Input
                            placeholder="成員姓名"
                            value={member.name}
                            onChange={(e) =>
                              updateMember(unitIdx, memberIdx, "name", e.target.value)
                            }
                            className="mt-1 h-9 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">角色</Label>
                          <Input
                            placeholder="職稱"
                            value={member.role}
                            onChange={(e) =>
                              updateMember(unitIdx, memberIdx, "role", e.target.value)
                            }
                            className="mt-1 h-9 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">時薪</Label>
                          <Input
                            type="number"
                            value={member.hourly_rate}
                            onChange={(e) =>
                              updateMember(unitIdx, memberIdx, "hourly_rate", Number(e.target.value))
                            }
                            className="mt-1 h-9 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">月工時</Label>
                          <Input
                            type="number"
                            value={member.monthly_hours}
                            onChange={(e) =>
                              updateMember(unitIdx, memberIdx, "monthly_hours", Number(e.target.value))
                            }
                            className="mt-1 h-9 text-sm"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive h-9"
                            onClick={() => removeMember(unitIdx, memberIdx)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => (step > 1 ? setStep(step - 1) : navigate("/dashboard"))}
            className="border-primary/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {step > 1 ? "上一步" : "取消"}
          </Button>

          {step < totalSteps ? (
            <Button
              className="bg-gradient-primary hover:shadow-glow"
              onClick={handleNext}
            >
              下一步
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="bg-gradient-primary hover:shadow-glow"
              onClick={handleFinish}
            >
              <Check className="w-4 h-4 mr-2" />
              完成建立
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AmoebaSetup;
