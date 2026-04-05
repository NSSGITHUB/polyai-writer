import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import { BONUS_METHOD_LABELS } from "@/types/amoeba";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Trophy,
  DollarSign,
  Users,
  Download,
  FileText,
  TrendingUp,
} from "lucide-react";
import jsPDF from "jspdf";

const COLORS = ["#eab308", "#22c55e", "#8b5cf6", "#3b82f6", "#ef4444", "#f97316", "#ec4899", "#14b8a6"];

const AmoebaBonusReport = () => {
  const store = useAmoebaStore();

  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [selectedRule, setSelectedRule] = useState<string>("active");

  const periods = useMemo(() => {
    const ps: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      ps.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return ps;
  }, []);

  const ruleId = selectedRule === "active" ? undefined : selectedRule;
  const { results, summaries } = store.calculateBonus(selectedPeriod, ruleId);

  const activeRule = selectedRule === "active"
    ? store.bonusRules.find((r) => r.is_active)
    : store.bonusRules.find((r) => r.id === selectedRule);

  const totalBonus = results.reduce((s, r) => s + r.bonus_amount, 0);
  const totalMembers = results.length;
  const avgBonus = totalMembers > 0 ? Math.round(totalBonus / totalMembers) : 0;
  const maxBonus = results.reduce((max, r) => Math.max(max, r.bonus_amount), 0);

  // Chart data
  const unitChartData = summaries.map((s, i) => ({
    name: s.unit_name,
    獎金總額: s.total_bonus,
    平均獎金: s.avg_bonus,
    color: COLORS[i % COLORS.length],
  }));

  const pieData = summaries.map((s, i) => ({
    name: s.unit_name,
    value: s.total_bonus,
    color: COLORS[i % COLORS.length],
  }));

  const exportCSV = () => {
    if (results.length === 0) return;
    const headers = ["單位", "編號", "姓名", "職稱", "月薪", "工時", "獎金", "獎金佔薪比(%)", "計算說明"];
    const rows = results.map((r) => [
      r.unit_name, r.unit_code, r.member_name, r.member_role,
      r.base_salary, r.monthly_hours, r.bonus_amount,
      r.bonus_ratio.toFixed(1), `"${r.calc_detail}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `績效獎金報表_${selectedPeriod}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (results.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const orgName = store.organization?.name || "Amoeba";
    const pw = doc.internal.pageSize.getWidth();

    doc.setFontSize(16);
    doc.text(`${orgName} - Bonus Report`, pw / 2, 14, { align: "center" });
    doc.setFontSize(10);
    doc.text(`Period: ${selectedPeriod} | Rule: ${activeRule?.name || "N/A"} | Method: ${activeRule ? BONUS_METHOD_LABELS[activeRule.method] : "N/A"}`, pw / 2, 21, { align: "center" });

    const cols = [35, 18, 28, 28, 28, 28, 22, 90];
    const headers = ["Unit", "Code", "Name", "Salary", "Hours", "Bonus", "Ratio%", "Detail"];
    let y = 30;

    doc.setFontSize(7);
    doc.setFillColor(100, 60, 180);
    doc.rect(8, y - 4, cols.reduce((a, b) => a + b, 0), 6, "F");
    doc.setTextColor(255, 255, 255);
    let x = 10;
    headers.forEach((h, i) => { doc.text(h, x, y); x += cols[i]; });

    doc.setTextColor(40, 40, 40);
    results.forEach((r, idx) => {
      y += 6;
      if (y > 190) {
        doc.addPage();
        y = 15;
      }
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 255);
        doc.rect(8, y - 4, cols.reduce((a, b) => a + b, 0), 6, "F");
      }
      const row = [
        r.unit_name, r.unit_code, r.member_name,
        `$${r.base_salary.toLocaleString()}`, `${r.monthly_hours}`,
        `$${r.bonus_amount.toLocaleString()}`, `${r.bonus_ratio.toFixed(1)}%`,
        r.calc_detail.substring(0, 70),
      ];
      let rx = 10;
      row.forEach((val, i) => { doc.text(val, rx, y); rx += cols[i]; });
    });

    y += 10;
    doc.setFontSize(9);
    doc.setTextColor(100, 60, 180);
    doc.text(`Total Bonus: $${totalBonus.toLocaleString()} | Members: ${totalMembers} | Avg: $${avgBonus.toLocaleString()}`, pw / 2, y, { align: "center" });

    doc.save(`Bonus_Report_${selectedPeriod}.pdf`);
  };

  return (
    <AmoebaLayout title="績效獎金報表" subtitle="根據獎金規則計算各成員的績效獎金">
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
          <Label className="text-xs text-muted-foreground">獎金規則</Label>
          <Select value={selectedRule} onValueChange={setSelectedRule}>
            <SelectTrigger className="w-52 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">啟用中的規則</SelectItem>
              {store.bonusRules.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name} ({BONUS_METHOD_LABELS[r.method]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="border-primary/30" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" />
          匯出 CSV
        </Button>
        <Button variant="outline" className="border-primary/30" onClick={exportPDF}>
          <FileText className="w-4 h-4 mr-2" />
          匯出 PDF
        </Button>
      </div>

      {/* No rule warning */}
      {!activeRule ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">尚未設定獎金規則</h3>
          <p className="text-muted-foreground mb-4">
            請先到「績效獎金規則」頁面建立並啟用獎金計算規則
          </p>
        </Card>
      ) : results.length === 0 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">本期無獎金數據</h3>
          <p className="text-muted-foreground">
            請確認已有經營數據（營收/費用）及活躍成員
          </p>
        </Card>
      ) : (
        <>
          {/* Rule Info */}
          <Card className="p-4 bg-primary/5 border-primary/10 mb-6">
            <div className="flex items-center gap-3">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-sm font-medium">使用規則：{activeRule.name}</span>
              <Badge className="text-xs bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                {BONUS_METHOD_LABELS[activeRule.method]}
              </Badge>
            </div>
          </Card>

          {/* KPI Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">獎金總額</p>
                  <p className="text-2xl font-bold text-yellow-400 mt-1">${totalBonus.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-400" />
              </div>
            </Card>
            <Card className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">發放人數</p>
                  <p className="text-2xl font-bold mt-1">{results.filter((r) => r.bonus_amount > 0).length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-400" />
              </div>
            </Card>
            <Card className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">平均獎金</p>
                  <p className="text-2xl font-bold text-green-400 mt-1">${avgBonus.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </Card>
            <Card className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">最高獎金</p>
                  <p className="text-2xl font-bold text-purple-400 mt-1">${maxBonus.toLocaleString()}</p>
                </div>
                <Trophy className="w-8 h-8 text-purple-400" />
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
              <h3 className="text-lg font-semibold mb-4">各單位獎金分布</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={unitChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
                    <XAxis dataKey="name" stroke="hsl(240 5% 65%)" fontSize={12} />
                    <YAxis stroke="hsl(240 5% 65%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(240 6% 10%)", border: "1px solid hsl(263 70% 50% / 0.3)", borderRadius: "8px" }}
                      formatter={(v: number) => `$${v.toLocaleString()}`}
                    />
                    <Legend />
                    <Bar dataKey="獎金總額" fill="#eab308" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="平均獎金" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
              <h3 className="text-lg font-semibold mb-4">獎金佔比</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData.filter((d) => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(240 6% 10%)", border: "1px solid hsl(263 70% 50% / 0.3)", borderRadius: "8px" }}
                      formatter={(v: number) => `$${v.toLocaleString()}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Tabs: Unit Summary / Individual Details */}
          <Tabs defaultValue="unit">
            <TabsList className="mb-4">
              <TabsTrigger value="unit">單位匯總</TabsTrigger>
              <TabsTrigger value="detail">個人明細</TabsTrigger>
            </TabsList>

            <TabsContent value="unit">
              <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
                <h3 className="text-lg font-semibold mb-4">各阿米巴獎金匯總</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-primary/20 text-muted-foreground">
                      <th className="text-left py-3 px-3">單位</th>
                      <th className="text-right py-3 px-3">成員數</th>
                      <th className="text-right py-3 px-3">附加價值</th>
                      <th className="text-right py-3 px-3">效率($/hr)</th>
                      <th className="text-right py-3 px-3">獎金總額</th>
                      <th className="text-right py-3 px-3">平均獎金</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaries.map((s) => (
                      <tr key={s.unit_id} className="border-b border-primary/5 hover:bg-primary/5">
                        <td className="py-3 px-3">
                          <span className="font-medium">{s.unit_name}</span>
                          <span className="text-xs text-muted-foreground ml-1">({s.unit_code})</span>
                        </td>
                        <td className="py-3 px-3 text-right">{s.member_count}</td>
                        <td className="py-3 px-3 text-right text-primary">${s.profit_contribution.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right">${Math.round(s.efficiency).toLocaleString()}</td>
                        <td className="py-3 px-3 text-right text-yellow-400 font-bold">${s.total_bonus.toLocaleString()}</td>
                        <td className="py-3 px-3 text-right">${s.avg_bonus.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-primary/30 font-bold">
                      <td className="py-3 px-3">合計</td>
                      <td className="py-3 px-3 text-right">{totalMembers}</td>
                      <td className="py-3 px-3 text-right text-primary">
                        ${summaries.reduce((s, u) => s + u.profit_contribution, 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right">-</td>
                      <td className="py-3 px-3 text-right text-yellow-400">${totalBonus.toLocaleString()}</td>
                      <td className="py-3 px-3 text-right">${avgBonus.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </Card>
            </TabsContent>

            <TabsContent value="detail">
              <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
                <h3 className="text-lg font-semibold mb-4">個人獎金明細</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-primary/20 text-muted-foreground">
                        <th className="text-left py-3 px-3">單位</th>
                        <th className="text-left py-3 px-3">姓名</th>
                        <th className="text-left py-3 px-3">職稱</th>
                        <th className="text-right py-3 px-3">月薪</th>
                        <th className="text-right py-3 px-3">工時</th>
                        <th className="text-right py-3 px-3">獎金</th>
                        <th className="text-right py-3 px-3">佔薪比</th>
                        <th className="text-left py-3 px-3">計算說明</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((r) => (
                        <tr key={r.member_id} className="border-b border-primary/5 hover:bg-primary/5">
                          <td className="py-3 px-3 text-muted-foreground">{r.unit_name}</td>
                          <td className="py-3 px-3 font-medium">{r.member_name}</td>
                          <td className="py-3 px-3 text-muted-foreground">{r.member_role}</td>
                          <td className="py-3 px-3 text-right">${r.base_salary.toLocaleString()}</td>
                          <td className="py-3 px-3 text-right">{r.monthly_hours} hr</td>
                          <td className={`py-3 px-3 text-right font-bold ${r.bonus_amount > 0 ? "text-yellow-400" : "text-muted-foreground"}`}>
                            ${r.bonus_amount.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {r.bonus_ratio > 0 ? `${r.bonus_ratio.toFixed(1)}%` : "-"}
                          </td>
                          <td className="py-3 px-3 text-xs text-muted-foreground max-w-xs truncate">
                            {r.calc_detail}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-primary/30 font-bold">
                        <td className="py-3 px-3" colSpan={5}>合計</td>
                        <td className="py-3 px-3 text-right text-yellow-400">${totalBonus.toLocaleString()}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </AmoebaLayout>
  );
};

export default AmoebaBonusReport;
