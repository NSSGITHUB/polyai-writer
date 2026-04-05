import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Target,
  Wallet,
  Trophy,
  Bell,
  ArrowRight,
} from "lucide-react";

interface Alert {
  id: string;
  type: "success" | "warning" | "danger" | "info";
  icon: React.ReactNode;
  title: string;
  description: string;
  link?: string;
  linkLabel?: string;
}

const AmoebaNotifications = () => {
  const store = useAmoebaStore();
  const navigate = useNavigate();

  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const alerts = useMemo(() => {
    const list: Alert[] = [];
    const reports = store.getAllReports(currentPeriod);

    // 1. Goal achievement alerts
    store.goals
      .filter((g) => g.period === currentPeriod)
      .forEach((goal) => {
        const report = reports.find((r) => r.unit_id === goal.unit_id);
        if (!report) return;
        const unitName = store.units.find((u) => u.id === goal.unit_id)?.name || "";

        if (goal.target_profit > 0) {
          const rate = (report.gross_profit / goal.target_profit) * 100;
          if (rate >= 120) {
            list.push({
              id: `goal-exceed-${goal.id}`,
              type: "success",
              icon: <Trophy className="w-5 h-5 text-yellow-400" />,
              title: `${unitName} 超額達標！`,
              description: `附加價值達成率 ${rate.toFixed(0)}%，超額完成本月目標`,
              link: "/amoeba/goals",
              linkLabel: "查看目標",
            });
          } else if (rate >= 100) {
            list.push({
              id: `goal-done-${goal.id}`,
              type: "success",
              icon: <CheckCircle2 className="w-5 h-5 text-green-400" />,
              title: `${unitName} 達成目標`,
              description: `附加價值達成率 ${rate.toFixed(0)}%`,
              link: "/amoeba/goals",
              linkLabel: "查看目標",
            });
          } else if (rate < 60) {
            list.push({
              id: `goal-low-${goal.id}`,
              type: "danger",
              icon: <TrendingDown className="w-5 h-5 text-red-400" />,
              title: `${unitName} 目標達成率偏低`,
              description: `附加價值達成率僅 ${rate.toFixed(0)}%，低於 60% 門檻`,
              link: "/amoeba/goals",
              linkLabel: "查看目標",
            });
          }
        }
      });

    // 2. Budget overrun alerts
    store.budgets
      .filter((b) => b.period === currentPeriod && b.budget_type === "expense")
      .forEach((budget) => {
        const actual = store.expenses
          .filter((e) => e.unit_id === budget.unit_id && e.period === currentPeriod && e.category === budget.category)
          .reduce((s, e) => s + e.amount, 0);
        const rate = budget.planned_amount > 0 ? (actual / budget.planned_amount) * 100 : 0;
        const unitName = store.units.find((u) => u.id === budget.unit_id)?.name || "";

        if (rate > 100) {
          list.push({
            id: `budget-over-${budget.id}`,
            type: "danger",
            icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
            title: `${unitName}「${budget.category}」超出預算！`,
            description: `預算 $${budget.planned_amount.toLocaleString()}，實際 $${actual.toLocaleString()}（${rate.toFixed(0)}%）`,
            link: "/amoeba/budgets",
            linkLabel: "查看預算",
          });
        } else if (rate > 80) {
          list.push({
            id: `budget-warn-${budget.id}`,
            type: "warning",
            icon: <AlertCircle className="w-5 h-5 text-yellow-400" />,
            title: `${unitName}「${budget.category}」接近預算上限`,
            description: `已使用 ${rate.toFixed(0)}% 的預算額度`,
            link: "/amoeba/budgets",
            linkLabel: "查看預算",
          });
        }
      });

    // 3. Efficiency alerts
    reports.forEach((report) => {
      if (report.hourly_efficiency > 0 && report.hourly_efficiency < 100) {
        list.push({
          id: `eff-low-${report.unit_id}`,
          type: "warning",
          icon: <TrendingDown className="w-5 h-5 text-orange-400" />,
          title: `${report.unit_name} 單位時間效率偏低`,
          description: `本期效率 $${Math.round(report.hourly_efficiency)}/hr，建議檢視成本結構`,
          link: "/amoeba/reports",
          linkLabel: "查看報表",
        });
      } else if (report.hourly_efficiency >= 800) {
        list.push({
          id: `eff-high-${report.unit_id}`,
          type: "success",
          icon: <TrendingUp className="w-5 h-5 text-green-400" />,
          title: `${report.unit_name} 效率表現優異！`,
          description: `單位時間效率 $${Math.round(report.hourly_efficiency)}/hr`,
          link: "/amoeba/reports",
          linkLabel: "查看報表",
        });
      }
    });

    // 4. Profit margin alerts
    reports.forEach((report) => {
      if (report.profit_margin < -10) {
        list.push({
          id: `margin-neg-${report.unit_id}`,
          type: "danger",
          icon: <AlertTriangle className="w-5 h-5 text-red-400" />,
          title: `${report.unit_name} 利潤率為負`,
          description: `利潤率 ${report.profit_margin.toFixed(1)}%，該單位處於虧損狀態`,
          link: "/amoeba/reports",
          linkLabel: "查看報表",
        });
      }
    });

    // 5. Missing data reminders
    if (store.units.length > 0 && reports.length === 0) {
      list.push({
        id: "no-data",
        type: "info",
        icon: <AlertCircle className="w-5 h-5 text-blue-400" />,
        title: "本月尚無經營數據",
        description: "請前往「經營會計」記錄本月的營收與費用",
        link: "/amoeba/accounting",
        linkLabel: "前往記錄",
      });
    }

    if (store.bonusRules.length === 0 && store.units.length > 0) {
      list.push({
        id: "no-bonus-rule",
        type: "info",
        icon: <Trophy className="w-5 h-5 text-yellow-400" />,
        title: "尚未設定獎金規則",
        description: "建立獎金規則後，系統可自動計算績效獎金",
        link: "/amoeba/bonus-rules",
        linkLabel: "前往設定",
      });
    }

    // Sort: danger > warning > info > success
    const priority = { danger: 0, warning: 1, info: 2, success: 3 };
    list.sort((a, b) => priority[a.type] - priority[b.type]);

    return list;
  }, [store, currentPeriod]);

  const typeStyles = {
    success: "border-green-500/20 bg-green-500/5",
    warning: "border-yellow-500/20 bg-yellow-500/5",
    danger: "border-red-500/20 bg-red-500/5",
    info: "border-blue-500/20 bg-blue-500/5",
  };

  const typeBadge = {
    success: { label: "達標", className: "bg-green-500/20 text-green-400 border-green-500/30" },
    warning: { label: "注意", className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" },
    danger: { label: "警告", className: "bg-red-500/20 text-red-400 border-red-500/30" },
    info: { label: "提醒", className: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  };

  const dangerCount = alerts.filter((a) => a.type === "danger").length;
  const warningCount = alerts.filter((a) => a.type === "warning").length;
  const successCount = alerts.filter((a) => a.type === "success").length;

  return (
    <AmoebaLayout title="通知與警報" subtitle={`${currentPeriod} 經營狀況即時監控`}>
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-gradient-card backdrop-blur-sm border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">總通知</p>
              <p className="text-2xl font-bold mt-1">{alerts.length}</p>
            </div>
            <Bell className="w-6 h-6 text-primary" />
          </div>
        </Card>
        <Card className="p-4 bg-red-500/5 border-red-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">警告</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{dangerCount}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
        </Card>
        <Card className="p-4 bg-yellow-500/5 border-yellow-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">注意</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{warningCount}</p>
            </div>
            <AlertCircle className="w-6 h-6 text-yellow-400" />
          </div>
        </Card>
        <Card className="p-4 bg-green-500/5 border-green-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">達標</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{successCount}</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-400" />
          </div>
        </Card>
      </div>

      {/* Alert List */}
      {alerts.length === 0 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">目前沒有通知</h3>
          <p className="text-muted-foreground">
            當出現預算超支、目標達成等事件時，系統會在此顯示通知
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className={`p-4 backdrop-blur-sm transition-colors ${typeStyles[alert.type]}`}
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 mt-0.5">{alert.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{alert.title}</span>
                    <Badge className={`text-xs ${typeBadge[alert.type].className}`}>
                      {typeBadge[alert.type].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.description}</p>
                </div>
                {alert.link && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => navigate(alert.link!)}
                  >
                    {alert.linkLabel}
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </AmoebaLayout>
  );
};

export default AmoebaNotifications;
