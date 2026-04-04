import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  GitCompareArrows,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const UNIT_COLORS = ["#8b5cf6", "#22c55e", "#eab308", "#ef4444", "#3b82f6", "#f97316", "#ec4899", "#14b8a6"];

const AmoebaComparison = () => {
  const store = useAmoebaStore();

  const now = new Date();
  const [rangeMonths, setRangeMonths] = useState("6");
  const [selectedUnits, setSelectedUnits] = useState<string[]>(
    store.units.slice(0, 4).map((u) => u.id)
  );
  const [metric, setMetric] = useState<"revenue" | "profit" | "efficiency" | "margin">("efficiency");

  const periods = useMemo(() => {
    const count = Number(rangeMonths);
    const ps: string[] = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      ps.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return ps;
  }, [rangeMonths]);

  const toggleUnit = (id: string) => {
    setSelectedUnits((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  // Build comparison data
  const comparisonData = useMemo(() => {
    return periods.map((period) => {
      const row: Record<string, string | number> = { period };
      selectedUnits.forEach((uid) => {
        const report = store.getMonthlyReport(uid, period);
        const unit = store.units.find((u) => u.id === uid);
        const name = unit?.name || "未知";
        if (report) {
          switch (metric) {
            case "revenue":
              row[name] = report.total_revenue;
              break;
            case "profit":
              row[name] = report.gross_profit;
              break;
            case "efficiency":
              row[name] = Math.round(report.hourly_efficiency);
              break;
            case "margin":
              row[name] = Number(report.profit_margin.toFixed(1));
              break;
          }
        } else {
          row[name] = 0;
        }
      });
      return row;
    });
  }, [periods, selectedUnits, metric, store]);

  // MoM change data (comparing last 2 periods)
  const momData = useMemo(() => {
    if (periods.length < 2) return [];
    const currentPeriod = periods[periods.length - 1];
    const prevPeriod = periods[periods.length - 2];

    return store.units
      .filter((u) => u.is_active)
      .map((unit) => {
        const curr = store.getMonthlyReport(unit.id, currentPeriod);
        const prev = store.getMonthlyReport(unit.id, prevPeriod);

        const currVal = curr
          ? metric === "revenue" ? curr.total_revenue
          : metric === "profit" ? curr.gross_profit
          : metric === "efficiency" ? curr.hourly_efficiency
          : curr.profit_margin
          : 0;

        const prevVal = prev
          ? metric === "revenue" ? prev.total_revenue
          : metric === "profit" ? prev.gross_profit
          : metric === "efficiency" ? prev.hourly_efficiency
          : prev.profit_margin
          : 0;

        const change = prevVal !== 0 ? ((currVal - prevVal) / Math.abs(prevVal)) * 100 : 0;

        return {
          unit_id: unit.id,
          unit_name: unit.name,
          unit_code: unit.code,
          current: currVal,
          previous: prevVal,
          change,
          diff: currVal - prevVal,
        };
      })
      .sort((a, b) => b.change - a.change);
  }, [periods, metric, store]);

  // Stacked bar data for revenue/expense breakdown
  const stackedData = useMemo(() => {
    return periods.map((period) => {
      const reports = store.getAllReports(period);
      const totalRevenue = reports.reduce((s, r) => s + r.total_revenue, 0);
      const totalLaborCost = reports.reduce((s, r) => s + r.labor_cost, 0);
      const totalNonLaborCost = reports.reduce((s, r) => s + r.non_labor_cost, 0);
      const totalProfit = reports.reduce((s, r) => s + r.gross_profit, 0);
      return {
        period,
        營收: totalRevenue,
        人事費: totalLaborCost,
        營業費: totalNonLaborCost,
        附加價值: totalProfit,
      };
    });
  }, [periods, store]);

  const metricLabels: Record<string, string> = {
    revenue: "營收",
    profit: "附加價值",
    efficiency: "單位時間效率",
    margin: "利潤率(%)",
  };

  const metricUnits: Record<string, string> = {
    revenue: "$",
    profit: "$",
    efficiency: "$/hr",
    margin: "%",
  };

  const formatValue = (val: number) => {
    if (metric === "margin") return `${val.toFixed(1)}%`;
    return `$${Math.round(val).toLocaleString()}`;
  };

  return (
    <AmoebaLayout title="多期比較分析" subtitle="跨期間比較各阿米巴的經營績效變化">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <Label className="text-xs text-muted-foreground">比較期間</Label>
          <Select value={rangeMonths} onValueChange={setRangeMonths}>
            <SelectTrigger className="w-36 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">近 3 個月</SelectItem>
              <SelectItem value="6">近 6 個月</SelectItem>
              <SelectItem value="12">近 12 個月</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">比較指標</Label>
          <Select value={metric} onValueChange={(v: typeof metric) => setMetric(v)}>
            <SelectTrigger className="w-44 mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">營收</SelectItem>
              <SelectItem value="profit">附加價值</SelectItem>
              <SelectItem value="efficiency">單位時間效率</SelectItem>
              <SelectItem value="margin">利潤率</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Unit Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        <span className="text-sm text-muted-foreground py-1">比較單位：</span>
        {store.units.map((unit, idx) => (
          <Button
            key={unit.id}
            variant={selectedUnits.includes(unit.id) ? "default" : "outline"}
            size="sm"
            className={selectedUnits.includes(unit.id) ? "" : "border-primary/30"}
            style={
              selectedUnits.includes(unit.id)
                ? { backgroundColor: UNIT_COLORS[idx % UNIT_COLORS.length] }
                : {}
            }
            onClick={() => toggleUnit(unit.id)}
          >
            {unit.name}
          </Button>
        ))}
      </div>

      {store.units.length === 0 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <GitCompareArrows className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">尚無資料可供比較</h3>
          <p className="text-muted-foreground">
            請先在「經營會計」中記錄營收與費用資料
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Trend Line Chart */}
          <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <h3 className="text-lg font-semibold mb-4">
              {metricLabels[metric]}趨勢比較
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
                  <XAxis dataKey="period" stroke="hsl(240 5% 65%)" fontSize={12} />
                  <YAxis stroke="hsl(240 5% 65%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(240 6% 10%)",
                      border: "1px solid hsl(263 70% 50% / 0.3)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) =>
                      metric === "margin" ? `${value}%` : `$${value.toLocaleString()}`
                    }
                  />
                  <Legend />
                  {selectedUnits.map((uid, idx) => {
                    const unit = store.units.find((u) => u.id === uid);
                    return (
                      <Line
                        key={uid}
                        type="monotone"
                        dataKey={unit?.name || ""}
                        stroke={UNIT_COLORS[store.units.findIndex((u) => u.id === uid) % UNIT_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Stacked Bar: Revenue breakdown over time */}
          <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <h3 className="text-lg font-semibold mb-4">全組織收支結構變化</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stackedData}>
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
                  <Bar dataKey="營收" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="人事費" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="營業費" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* MoM Change Table */}
          <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <h3 className="text-lg font-semibold mb-4">
              月環比變化（{metricLabels[metric]}）
              <span className="text-sm font-normal text-muted-foreground ml-2">
                {periods.length >= 2 && `${periods[periods.length - 2]} → ${periods[periods.length - 1]}`}
              </span>
            </h3>

            {momData.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                需要至少 2 個月的數據才能計算環比
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/20 text-muted-foreground">
                    <th className="text-left py-3 px-3">阿米巴</th>
                    <th className="text-right py-3 px-3">上期</th>
                    <th className="text-right py-3 px-3">本期</th>
                    <th className="text-right py-3 px-3">變化</th>
                    <th className="text-right py-3 px-3">成長率</th>
                    <th className="text-left py-3 px-3">趨勢</th>
                  </tr>
                </thead>
                <tbody>
                  {momData.map((row) => (
                    <tr key={row.unit_id} className="border-b border-primary/5 hover:bg-primary/5">
                      <td className="py-3 px-3">
                        <span className="font-medium">{row.unit_name}</span>
                        <span className="text-xs text-muted-foreground ml-1">({row.unit_code})</span>
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground">
                        {formatValue(row.previous)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium">
                        {formatValue(row.current)}
                      </td>
                      <td className={`py-3 px-3 text-right font-medium ${row.diff >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {row.diff >= 0 ? "+" : ""}{formatValue(row.diff)}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${row.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {row.change >= 0 ? "+" : ""}{row.change.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3">
                        {row.change > 5 ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                            <ArrowUp className="w-3 h-3 mr-1" />成長
                          </Badge>
                        ) : row.change < -5 ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                            <ArrowDown className="w-3 h-3 mr-1" />衰退
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                            <Minus className="w-3 h-3 mr-1" />持平
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}
    </AmoebaLayout>
  );
};

export default AmoebaComparison;
