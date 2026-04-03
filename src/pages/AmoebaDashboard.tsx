import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  Building2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";

const COLORS = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#6d28d9", "#7c3aed", "#5b21b6", "#4c1d95", "#ddd6fe"];

const AmoebaDashboard = () => {
  const navigate = useNavigate();
  const store = useAmoebaStore();

  const now = new Date();
  const [selectedPeriod, setSelectedPeriod] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  // If no organization, redirect to setup
  if (!store.organization) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center max-w-lg">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-primary mb-6">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-3">開始您的阿米巴之旅</h2>
          <p className="text-muted-foreground mb-6 leading-relaxed">
            阿米巴經營是讓企業每位員工都成為經營者的管理哲學。
            透過導入精靈，只需 3 步即可建立您的阿米巴經營體系。
          </p>
          <Button
            className="bg-gradient-primary hover:shadow-glow"
            size="lg"
            onClick={() => navigate("/amoeba/setup")}
          >
            <Sparkles className="w-5 h-5 mr-2" />
            啟動導入精靈
          </Button>
        </Card>
      </div>
    );
  }

  const reports = store.getAllReports(selectedPeriod);

  const totalRevenue = reports.reduce((s, r) => s + r.total_revenue, 0);
  const totalExpense = reports.reduce((s, r) => s + r.total_expense, 0);
  const totalProfit = reports.reduce((s, r) => s + r.gross_profit, 0);
  const totalHours = reports.reduce((s, r) => s + r.total_labor_hours, 0);
  const avgEfficiency = totalHours > 0 ? totalProfit / totalHours : 0;
  const totalMembers = reports.reduce((s, r) => s + r.member_count, 0);

  const periods = useMemo(() => {
    const ps: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      ps.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return ps;
  }, []);

  const efficiencyData = reports
    .sort((a, b) => b.hourly_efficiency - a.hourly_efficiency)
    .map((r) => ({
      name: r.unit_name,
      效率: Math.round(r.hourly_efficiency),
      營收: r.total_revenue,
      費用: r.total_expense,
    }));

  const revenueByUnit = reports.map((r, i) => ({
    name: r.unit_name,
    value: r.total_revenue,
    color: COLORS[i % COLORS.length],
  }));

  const radarData = reports.map((r) => ({
    unit: r.unit_name,
    營收: r.total_revenue,
    附加價值: r.gross_profit,
    效率: r.hourly_efficiency * 100,
  }));

  const statsCards = [
    { label: "總營收", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-green-400", sub: store.organization.currency },
    { label: "總費用", value: `$${totalExpense.toLocaleString()}`, icon: TrendingDown, color: "text-red-400", sub: "含人事費" },
    { label: "附加價值", value: `$${totalProfit.toLocaleString()}`, icon: TrendingUp, color: "text-primary", sub: "營收-非人事費" },
    { label: "平均單位時間效率", value: `$${Math.round(avgEfficiency).toLocaleString()}`, icon: Clock, color: "text-yellow-400", sub: "/小時" },
    { label: "總工時", value: `${totalHours.toLocaleString()} hr`, icon: Clock, color: "text-blue-400", sub: "本期合計" },
    { label: "阿米巴 / 人數", value: `${store.units.length} / ${totalMembers}`, icon: Building2, color: "text-accent", sub: "運作中" },
  ];

  return (
    <AmoebaLayout title="經營總覽" subtitle={`${store.organization.name} - ${selectedPeriod}`}>
      {/* Period Selector */}
      <div className="flex justify-end mb-6">
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statsCards.map((stat, idx) => (
          <Card key={idx} className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
          </Card>
        ))}
      </div>

      {reports.length === 0 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">尚未有經營數據</h3>
          <p className="text-muted-foreground mb-4">
            前往「經營會計」頁面，開始記錄各阿米巴的營收與費用
          </p>
          <Button
            className="bg-gradient-primary hover:shadow-glow"
            onClick={() => navigate("/amoeba/accounting")}
          >
            前往經營會計
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Efficiency Bar Chart */}
          <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <h3 className="text-lg font-semibold mb-4">單位時間附加價值排行</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 20%)" />
                  <XAxis dataKey="name" stroke="hsl(240 5% 65%)" fontSize={12} />
                  <YAxis stroke="hsl(240 5% 65%)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(240 6% 10%)",
                      border: "1px solid hsl(263 70% 50% / 0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="效率" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Revenue Pie Chart */}
          <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <h3 className="text-lg font-semibold mb-4">各單位營收佔比</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueByUnit}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {revenueByUnit.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(240 6% 10%)",
                      border: "1px solid hsl(263 70% 50% / 0.3)",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => `$${value.toLocaleString()}`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Unit Comparison Table */}
          <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">各阿米巴經營績效一覽</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-primary/20">
                    <th className="text-left py-3 px-4">單位</th>
                    <th className="text-right py-3 px-4">營收</th>
                    <th className="text-right py-3 px-4">費用</th>
                    <th className="text-right py-3 px-4">附加價值</th>
                    <th className="text-right py-3 px-4">工時</th>
                    <th className="text-right py-3 px-4">單位時間效率</th>
                    <th className="text-right py-3 px-4">利潤率</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.unit_id} className="border-b border-primary/10 hover:bg-primary/5">
                      <td className="py-3 px-4">
                        <div>
                          <span className="font-medium">{r.unit_name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{r.unit_code}</span>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 text-green-400">
                        ${r.total_revenue.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-red-400">
                        ${r.total_expense.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-primary font-medium">
                        ${r.gross_profit.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        {r.total_labor_hours.toLocaleString()} hr
                      </td>
                      <td className="text-right py-3 px-4 font-bold text-yellow-400">
                        ${Math.round(r.hourly_efficiency).toLocaleString()}
                      </td>
                      <td className={`text-right py-3 px-4 font-medium ${r.profit_margin >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {r.profit_margin.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-primary/30 font-bold">
                    <td className="py-3 px-4">合計</td>
                    <td className="text-right py-3 px-4 text-green-400">${totalRevenue.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-red-400">${totalExpense.toLocaleString()}</td>
                    <td className="text-right py-3 px-4 text-primary">${totalProfit.toLocaleString()}</td>
                    <td className="text-right py-3 px-4">{totalHours.toLocaleString()} hr</td>
                    <td className="text-right py-3 px-4 text-yellow-400">${Math.round(avgEfficiency).toLocaleString()}</td>
                    <td className="text-right py-3 px-4">
                      {totalRevenue > 0 ? (((totalRevenue - totalExpense) / totalRevenue) * 100).toFixed(1) : "0.0"}%
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      )}
    </AmoebaLayout>
  );
};

export default AmoebaDashboard;
