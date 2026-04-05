import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import { ROLE_LABELS } from "@/types/amoeba";
import AmoebaAuthGuard from "./AmoebaAuthGuard";
import {
  LayoutDashboard,
  Building2,
  Calculator,
  ArrowLeftRight,
  BarChart3,
  Settings,
  ArrowLeft,
  Sparkles,
  Target,
  Wallet,
  GitCompareArrows,
  Users,
  ScrollText,
  User,
  ChevronsUpDown,
  Trophy,
  Star,
} from "lucide-react";

interface AmoebaLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

const navItems = [
  { path: "/amoeba", label: "經營總覽", icon: LayoutDashboard },
  { path: "/amoeba/units", label: "組織管理", icon: Building2 },
  { path: "/amoeba/accounting", label: "經營會計", icon: Calculator },
  { path: "/amoeba/transfers", label: "內部交易", icon: ArrowLeftRight },
  { path: "/amoeba/goals", label: "目標設定", icon: Target },
  { path: "/amoeba/budgets", label: "預算管理", icon: Wallet },
  { path: "/amoeba/bonus-rules", label: "獎金規則", icon: Star },
  { path: "/amoeba/bonus-report", label: "獎金報表", icon: Trophy },
  { path: "/amoeba/reports", label: "經營報表", icon: BarChart3 },
  { path: "/amoeba/comparison", label: "多期比較", icon: GitCompareArrows },
  { path: "/amoeba/team", label: "團隊協作", icon: Users },
  { path: "/amoeba/activity", label: "操作日誌", icon: ScrollText },
  { path: "/amoeba/settings", label: "系統設定", icon: Settings },
];

const AmoebaLayout = ({ children, title, subtitle }: AmoebaLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useAmoebaStore();

  const { userContext, allOrganizations, switchOrganization } = store;

  const roleBadgeColor: Record<string, string> = {
    owner: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    admin: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    manager: "bg-green-500/20 text-green-400 border-green-500/30",
    viewer: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  };

  return (
    <AmoebaAuthGuard>
      <div className="min-h-screen bg-gradient-hero">
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 min-h-screen bg-card/50 backdrop-blur-sm border-r border-primary/20 p-4 flex flex-col">
            {/* Back + Branding */}
            <div className="mb-6">
              <div
                className="flex items-center gap-2 cursor-pointer mb-4"
                onClick={() => navigate("/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">返回控制台</span>
              </div>
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-lg leading-tight">阿米巴經營</h2>
                  <p className="text-xs text-muted-foreground">管理系統</p>
                </div>
              </div>
            </div>

            {/* Organization Switcher */}
            {allOrganizations.length > 1 && (
              <div className="mb-4 px-1">
                <Select
                  value={userContext.currentOrgId || ""}
                  onValueChange={switchOrganization}
                >
                  <SelectTrigger className="h-9 text-xs bg-background/50 border-primary/20">
                    <ChevronsUpDown className="w-3 h-3 mr-1 shrink-0" />
                    <SelectValue placeholder="選擇組織" />
                  </SelectTrigger>
                  <SelectContent>
                    {allOrganizations.map(({ org, role }) => (
                      <SelectItem key={org.id} value={org.id}>
                        <div className="flex items-center gap-2">
                          <span>{org.name}</span>
                          <Badge className={`text-[10px] px-1 py-0 ${roleBadgeColor[role] || ""}`}>
                            {ROLE_LABELS[role]}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Current org name (when only one) */}
            {allOrganizations.length === 1 && store.organization && (
              <div className="mb-4 px-3 py-2 bg-background/30 rounded-lg text-sm">
                <p className="font-medium truncate">{store.organization.name}</p>
                {userContext.role && (
                  <Badge className={`text-[10px] px-1 py-0 mt-1 ${roleBadgeColor[userContext.role] || ""}`}>
                    {ROLE_LABELS[userContext.role]}
                  </Badge>
                )}
              </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                      isActive
                        ? "bg-primary/20 text-primary-foreground border border-primary/30"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* User info */}
            <div className="mt-auto pt-4 border-t border-primary/10">
              <div className="flex items-center gap-2 px-3 py-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{userContext.userName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{userContext.userEmail}</p>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8">
            <div className="mb-8">
              <h1 className="text-3xl font-bold">{title}</h1>
              {subtitle && (
                <p className="text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            {children}
          </main>
        </div>
      </div>
    </AmoebaAuthGuard>
  );
};

export default AmoebaLayout;
