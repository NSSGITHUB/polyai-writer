import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  BarChart3,
  TrendingUp,
  Download,
  Clock,
} from "lucide-react";

const AmoebaReports = () => {
  const store = useAmoebaStore();

  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );
  const [selectedUnit, setSelectedUnit] = useState<string>("all");

  const periods = useMemo(() => {
    const ps: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      ps.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return ps;
  }, []);

  const reports = store.getAllReports(selectedPeriod);
  const filteredReports =
    selectedUnit === "all"
      ? reports
      : reports.filter((r) => r.unit_id === selectedUnit);

  // Trend data for the last 6 months
  const trendData = useMemo(() => {
    const last6 = periods.slice(0, 6).reverse();
    return last6.map((period) => {
      const periodReports = store.getAllReports(period);
      const filtered =
        selectedUnit === "all"
          ? periodReports
          : periodReports.filter((r) => r.unit_id === selectedUnit);

      const totalRevenue = filtered.reduce((s, r) => s + r.total_revenue, 0);
      const totalExpense = filtered.reduce((s, r) => s + r.total_expense, 0);
      const grossProfit = filtered.reduce((s, r) => s + r.gross_profit, 0);
      const totalHours = filtered.reduce((s, r) => s + r.total_labor_hours, 0);
      const efficiency = totalHours > 0 ? grossProfit / totalHours : 0;

      return {
        period,
        營收: totalRevenue,
        費用: totalExpense,
        附加價值: grossProfit,
        單位時間效率: Math.round(efficiency),
      };
    });
  }, [periods, store, selectedUnit]);

  const exportCSV = () => {
    if (filteredReports.length === 0) return;

    const headers = [
      "單位名稱",
      "編號",
      "營收",
      "外部營收",
      "內部營收",
      "總費用",
      "人事費",
      "非人事費",
      "附加價值",
      "工時",
      "單位時間效率",
      "利潤率(%)",
    ];

    const rows = filteredReports.map((r) => [
      r.unit_name,
      r.unit_code,
      r.total_revenue,
      r.external_revenue,
      r.internal_revenue,
      r.total_expense,
      r.labor_cost,
      r.non_labor_cost,
      r.gross_profit,
      r.total_labor_hours,
      Math.round(r.hourly_efficiency),
      r.profit_margin.toFixed(1),
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `阿米巴報表_${selectedPeriod}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AmoebaLayout title="經營報表" subtitle="分析各阿米巴的經營績效與單位時間附加價值">
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
        <Button variant="outline" className="border-primary/30" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-2" />
          匯出 CSV
        </Button>
      </div>

      {filteredReports.length === 0 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">本期尚無報表資料</h3>
          <p className="text-muted-foreground">
            請先在「經營會計」頁面記錄營收與費用，報表將自動產生
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Detailed P&L Table */}
          <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              {selectedPeriod} 單位時間附加價值報表
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-3 px-3 font-semibold" rowSpan={2}>阿米巴</th>
                    <th className="text-center py-2 px-3 font-semibold border-b border-primary/10" colSpan={3}>營收</th>
                    <th className="text-center py-2 px-3 font-semibold border-b border-primary/10" colSpan={3}>費用</th>
                    <th className="text-right py-3 px-3 font-semibold" rowSpan={2}>附加價值</th>
                    <th className="text-right py-3 px-3 font-semibold" rowSpan={2}>工時(hr)</th>
                    <th className="text-right py-3 px-3 font-semibold bg-primary/10" rowSpan={2}>
                      單位時間<br />附加價值
                    </th>
                  </tr>
                  <tr className="border-b border-primary/20 text-muted-foreground text-xs">
                    <th className="text-right py-2 px-3">外部</th>
                    <th className="text-right py-2 px-3">內部</th>
                    <th className="text-right py-2 px-3">合計</th>
                    <th className="text-right py-2 px-3">人事費</th>
                    <th className="text-right py-2 px-3">非人事費</th>
                    <th className="text-right py-2 px-3">合計</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((r) => (
                    <tr key={r.unit_id} className="border-b border-primary/5 hover:bg-primary/5">
                      <td className="py-3 px-3">
                        <span className="font-medium">{r.unit_name}</span>
                        <span className="text-xs text-muted-foreground ml-1">({r.unit_code})</span>
                      </td>
                      <td className="text-right py-3 px-3">${r.external_revenue.toLocaleString()}</td>
                      <td className="text-right py-3 px-3">${r.internal_revenue.toLocaleString()}</td>
                      <td className="text-right py-3 px-3 text-green-400 font-medium">
                        ${r.total_revenue.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-3">${r.labor_cost.toLocaleString()}</td>
                      <td className="text-right py-3 px-3">${r.non_labor_cost.toLocaleString()}</td>
                      <td className="text-right py-3 px-3 text-red-400 font-medium">
                        ${r.total_expense.toLocaleString()}
                      </td>
                      <td className={`text-right py-3 px-3 font-medium ${r.gross_profit >= 0 ? "text-primary" : "text-red-400"}`}>
                        ${r.gross_profit.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-3">{r.total_labor_hours.toLocaleString()}</td>
                      <td className="text-right py-3 px-3 font-bold text-yellow-400 bg-primary/5">
                        ${Math.round(r.hourly_efficiency).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/30 font-bold">
                    <td className="py-3 px-3">合計</td>
                    <td className="text-right py-3 px-3">
                      ${filteredReports.reduce((s, r) => s + r.external_revenue, 0).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-3">
                      ${filteredReports.reduce((s, r) => s + r.internal_revenue, 0).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-3 text-green-400">
                      ${filteredReports.reduce((s, r) => s + r.total_revenue, 0).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-3">
                      ${filteredReports.reduce((s, r) => s + r.labor_cost, 0).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-3">
                      ${filteredReports.reduce((s, r) => s + r.non_labor_cost, 0).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-3 text-red-400">
                      ${filteredReports.reduce((s, r) => s + r.total_expense, 0).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-3 text-primary">
                      ${filteredReports.reduce((s, r) => s + r.gross_profit, 0).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-3">
                      {filteredReports.reduce((s, r) => s + r.total_labor_hours, 0).toLocaleString()}
                    </td>
                    <td className="text-right py-3 px-3 text-yellow-400 bg-primary/5">
                      ${(() => {
                        const tp = filteredReports.reduce((s, r) => s + r.gross_profit, 0);
                        const th = filteredReports.reduce((s, r) => s + r.total_labor_hours, 0);
                        return th > 0 ? Math.round(tp / th).toLocaleString() : "0";
                      })()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-4 p-3 bg-primary/5 border border-primary/10 rounded-lg text-sm text-muted-foreground">
              <strong className="text-foreground">計算公式：</strong>
              附加價值 = 總營收 - 非人事費用 ｜ 單位時間附加價值 = 附加價值 ÷ 總工時
            </div>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Efficiency Comparison */}
            <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
              <h3 className="text-lg font-semibold mb-4">單位時間效率比較</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={filteredReports.map((r) => ({
                      name: r.unit_name,
                      效率: Math.round(r.hourly_efficiency),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
                    <XAxis dataKey="name" stroke="hsl(240 5% 65%)" fontSize={12} />
                    <YAxis stroke="hsl(240 5% 65%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(240 6% 10%)",
                        border: "1px solid hsl(263 70% 50% / 0.3)",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`$${value}`, "單位時間效率"]}
                    />
                    <Bar dataKey="效率" fill="#eab308" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Trend Chart */}
            <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
              <h3 className="text-lg font-semibold mb-4">近 6 個月趨勢</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
                    <XAxis dataKey="period" stroke="hsl(240 5% 65%)" fontSize={12} />
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
                    <Line type="monotone" dataKey="營收" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="附加價值" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="單位時間效率" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Individual Unit P&L Cards */}
          <h3 className="text-lg font-semibold mt-2">各阿米巴損益卡</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredReports.map((r) => (
              <Card key={r.unit_id} className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold">{r.unit_name}</h4>
                    <span className="text-xs text-muted-foreground">{r.unit_code}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">單位時間效率</p>
                    <p className="text-xl font-bold text-yellow-400">
                      ${Math.round(r.hourly_efficiency).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">營收</span>
                    <span className="text-green-400">${r.total_revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">非人事費</span>
                    <span className="text-red-400">-${r.non_labor_cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-primary/10 pt-2">
                    <span className="font-medium">附加價值</span>
                    <span className={`font-bold ${r.gross_profit >= 0 ? "text-primary" : "text-red-400"}`}>
                      ${r.gross_profit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">人事費</span>
                    <span>-${r.labor_cost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t border-primary/10 pt-2">
                    <span className="font-medium">淨利</span>
                    <span className={`font-bold ${r.total_revenue - r.total_expense >= 0 ? "text-green-400" : "text-red-400"}`}>
                      ${(r.total_revenue - r.total_expense).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>成員 {r.member_count} 人 / 工時 {r.total_labor_hours} hr</span>
                    <span>利潤率 {r.profit_margin.toFixed(1)}%</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </AmoebaLayout>
  );
};

export default AmoebaReports;
