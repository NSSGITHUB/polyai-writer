import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Landmark,
  CalendarCheck,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInvoices, useBills, useExpenses, useBankTransactions } from "@/hooks/useAccounting";

const AccountingDashboard = () => {
  const navigate = useNavigate();
  const { data: invoices, loading: invLoading } = useInvoices();
  const { data: bills, loading: billLoading } = useBills();
  const { data: expenses, loading: expLoading } = useExpenses();
  const { data: bankTxns, loading: bankLoading } = useBankTransactions();

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) navigate("/auth");
  }, [navigate]);

  const isLoading = invLoading || billLoading || expLoading || bankLoading;

  const totalAR = invoices.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + Number(i.total_amount) - Number(i.paid_amount), 0);
  const totalAP = bills.filter(b => b.status !== "paid" && b.status !== "cancelled").reduce((s, b) => s + Number(b.total_amount) - Number(b.paid_amount), 0);
  const pendingExpenses = expenses.filter(e => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0);
  const unreconciledCount = bankTxns.filter(t => !t.is_reconciled).length;
  const overdueInvoices = invoices.filter(i => i.status === "overdue" || (i.status === "sent" && new Date(i.due_date) < new Date())).length;
  const overdueBills = bills.filter(b => b.status === "overdue" || (b.status === "pending" && new Date(b.due_date) < new Date())).length;

  const formatCurrency = (n: number) => `NT$ ${n.toLocaleString("zh-TW", { minimumFractionDigits: 0 })}`;

  const statsData = [
    { label: "應收帳款餘額", value: formatCurrency(totalAR), icon: TrendingUp, color: "text-success", sub: overdueInvoices > 0 ? `${overdueInvoices} 筆逾期` : "正常" },
    { label: "應付帳款餘額", value: formatCurrency(totalAP), icon: TrendingDown, color: "text-warning", sub: overdueBills > 0 ? `${overdueBills} 筆逾期` : "正常" },
    { label: "待審費用報銷", value: formatCurrency(pendingExpenses), icon: DollarSign, color: "text-accent", sub: `${expenses.filter(e => e.status === "pending").length} 筆待審` },
    { label: "未對帳交易", value: unreconciledCount.toString(), icon: AlertTriangle, color: "text-destructive", sub: "筆交易待對帳" },
  ];

  const modules = [
    { title: "應收帳款 (AR)", desc: "發票管理、收款對帳、催款通知", icon: Receipt, color: "text-primary-glow", path: "/accounting/receivables" },
    { title: "應付帳款 (AP)", desc: "供應商帳單管理、付款排程", icon: CreditCard, color: "text-accent", path: "/accounting/payables" },
    { title: "費用報銷", desc: "員工報銷提交、審核、付款", icon: FileSpreadsheet, color: "text-success", path: "/accounting/expenses" },
    { title: "銀行對帳", desc: "銀行交易匹配、差異調整", icon: Landmark, color: "text-info", path: "/accounting/reconciliation" },
    { title: "月結 / 財務報表", desc: "會計分錄、損益表、資產負債表", icon: CalendarCheck, color: "text-warning", path: "/accounting/reports" },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" size="sm" className="border-primary/30" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 w-4 h-4" />返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">會計自動化系統</h1>
            <p className="text-muted-foreground">即時掌握應收、應付、費用與對帳狀態</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, i) => (
            <Card key={i} className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold">{isLoading ? "..." : stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{isLoading ? "" : stat.sub}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </Card>
          ))}
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <Card
              key={i}
              className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 hover:shadow-card transition-all cursor-pointer group"
              onClick={() => navigate(mod.path)}
            >
              <mod.icon className={`w-12 h-12 ${mod.color} mb-4 group-hover:scale-110 transition-transform`} />
              <h3 className="text-xl font-semibold mb-2">{mod.title}</h3>
              <p className="text-muted-foreground">{mod.desc}</p>
            </Card>
          ))}

          <Card
            className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 hover:shadow-card transition-all cursor-pointer group"
            onClick={() => navigate("/accounting-automation")}
          >
            <CalendarCheck className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-2">自動化流程總覽</h3>
            <p className="text-muted-foreground">查看 5 大會計自動化流程規劃</p>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AccountingDashboard;
