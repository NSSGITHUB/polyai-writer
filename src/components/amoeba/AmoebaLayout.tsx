import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Building2,
  Calculator,
  ArrowLeftRight,
  BarChart3,
  Settings,
  ArrowLeft,
  Sparkles,
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
  { path: "/amoeba/reports", label: "經營報表", icon: BarChart3 },
  { path: "/amoeba/settings", label: "系統設定", icon: Settings },
];

const AmoebaLayout = ({ children, title, subtitle }: AmoebaLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen bg-card/50 backdrop-blur-sm border-r border-primary/20 p-4 flex flex-col">
          <div className="mb-8">
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

          <div className="mt-auto pt-4 border-t border-primary/10">
            <div className="px-3 py-2 text-xs text-muted-foreground">
              <p>稻盛和夫阿米巴經營哲學</p>
              <p className="mt-1 opacity-70">讓每位員工成為經營者</p>
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
  );
};

export default AmoebaLayout;
