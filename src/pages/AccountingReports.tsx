import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useJournalEntries, useInvoices, useBills, useExpenses, useBankTransactions } from "@/hooks/useAccounting";
import { ACCOUNT_OPTIONS } from "@/types/accounting";

const AccountingReports = () => {
  const navigate = useNavigate();
  const { data: entries, loading, insert, remove } = useJournalEntries();
  const { data: invoices } = useInvoices();
  const { data: bills } = useBills();
  const { data: expenses } = useExpenses();
  const { data: bankTxns } = useBankTransactions();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("journal");
  const [form, setForm] = useState({
    entry_number: "",
    entry_date: new Date().toISOString().split("T")[0],
    description: "",
    debit_account: "",
    credit_account: "",
    amount: "",
    period: "",
  });

  const currentPeriod = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const resetForm = () => setForm({
    entry_number: `JE-${Date.now()}`,
    entry_date: new Date().toISOString().split("T")[0],
    description: "",
    debit_account: "",
    credit_account: "",
    amount: "",
    period: currentPeriod,
  });

  const handleCreate = async () => {
    await insert({
      entry_number: form.entry_number,
      entry_date: form.entry_date,
      description: form.description,
      debit_account: form.debit_account,
      credit_account: form.credit_account,
      amount: parseFloat(form.amount) || 0,
      type: "manual",
      period: form.period,
    } as any);
    setDialogOpen(false);
  };

  // Income Statement calculations
  const totalRevenue = invoices.filter(i => i.status === "paid").reduce((s, i) => s + Number(i.total_amount), 0);
  const totalCOGS = bills.filter(b => b.status === "paid" && b.category === "設備採購").reduce((s, b) => s + Number(b.total_amount), 0);
  const totalOpex = bills.filter(b => b.status === "paid" && b.category !== "設備採購").reduce((s, b) => s + Number(b.total_amount), 0)
    + expenses.filter(e => e.status === "paid").reduce((s, e) => s + Number(e.amount), 0);
  const grossProfit = totalRevenue - totalCOGS;
  const netIncome = grossProfit - totalOpex;

  // Balance Sheet calculations
  const cashBalance = bankTxns.reduce((s, t) => {
    const amt = Number(t.amount);
    return s + (t.type === "credit" ? amt : -amt);
  }, 0);
  const arBalance = invoices.filter(i => i.status !== "paid" && i.status !== "cancelled").reduce((s, i) => s + Number(i.total_amount) - Number(i.paid_amount), 0);
  const apBalance = bills.filter(b => b.status !== "paid" && b.status !== "cancelled").reduce((s, b) => s + Number(b.total_amount) - Number(b.paid_amount), 0);
  const totalAssets = cashBalance + arBalance;
  const totalLiabilities = apBalance;
  const equity = totalAssets - totalLiabilities;

  const formatCurrency = (n: number) => `NT$ ${Number(n).toLocaleString("zh-TW", { minimumFractionDigits: 0 })}`;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="border-primary/30" onClick={() => navigate("/accounting")}>
              <ArrowLeft className="mr-2 w-4 h-4" />返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold">月結 / 財務報表</h1>
              <p className="text-muted-foreground">會計分錄與財務報表生成</p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="journal">會計分錄</TabsTrigger>
            <TabsTrigger value="income">損益表</TabsTrigger>
            <TabsTrigger value="balance">資產負債表</TabsTrigger>
          </TabsList>

          {/* Journal Entries Tab */}
          <TabsContent value="journal">
            <div className="flex justify-end mb-4">
              <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) resetForm(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:shadow-glow">
                    <Plus className="mr-2 w-4 h-4" />新增分錄
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>新增會計分錄</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>分錄編號</Label><Input value={form.entry_number} onChange={e => setForm(f => ({ ...f, entry_number: e.target.value }))} /></div>
                      <div><Label>日期</Label><Input type="date" value={form.entry_date} onChange={e => setForm(f => ({ ...f, entry_date: e.target.value }))} /></div>
                    </div>
                    <div><Label>說明</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>借方科目</Label>
                        <Select value={form.debit_account} onValueChange={v => setForm(f => ({ ...f, debit_account: v }))}>
                          <SelectTrigger><SelectValue placeholder="選擇科目" /></SelectTrigger>
                          <SelectContent>
                            {ACCOUNT_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>貸方科目</Label>
                        <Select value={form.credit_account} onValueChange={v => setForm(f => ({ ...f, credit_account: v }))}>
                          <SelectTrigger><SelectValue placeholder="選擇科目" /></SelectTrigger>
                          <SelectContent>
                            {ACCOUNT_OPTIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>金額</Label><Input type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                      <div><Label>期間</Label><Input type="month" value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))} /></div>
                    </div>
                    <Button className="w-full bg-gradient-primary" onClick={handleCreate}>建立分錄</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card className="bg-gradient-card backdrop-blur-sm border-primary/20">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>編號</TableHead>
                    <TableHead>日期</TableHead>
                    <TableHead>說明</TableHead>
                    <TableHead>借方科目</TableHead>
                    <TableHead>貸方科目</TableHead>
                    <TableHead className="text-right">金額</TableHead>
                    <TableHead>期間</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
                  ) : entries.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">尚無分錄資料</TableCell></TableRow>
                  ) : (
                    entries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono text-sm">{entry.entry_number}</TableCell>
                        <TableCell>{entry.entry_date}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{entry.description}</TableCell>
                        <TableCell className="text-sm">{entry.debit_account}</TableCell>
                        <TableCell className="text-sm">{entry.credit_account}</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(entry.amount)}</TableCell>
                        <TableCell>{entry.period || "-"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => remove(entry.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Income Statement Tab */}
          <TabsContent value="income">
            <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-6 h-6 text-primary-glow" />
                <h2 className="text-2xl font-bold">損益表</h2>
                <Badge variant="outline" className="ml-2">{currentPeriod}</Badge>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-primary/10">
                  <span className="font-semibold">營業收入</span>
                  <span className="font-bold text-success">{formatCurrency(totalRevenue)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-primary/10 pl-4">
                  <span className="text-muted-foreground">減：營業成本</span>
                  <span className="text-destructive">({formatCurrency(totalCOGS)})</span>
                </div>
                <div className="flex justify-between py-2 border-b-2 border-primary/30">
                  <span className="font-semibold">毛利</span>
                  <span className={`font-bold ${grossProfit >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(grossProfit)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-primary/10 pl-4">
                  <span className="text-muted-foreground">減：營業費用</span>
                  <span className="text-destructive">({formatCurrency(totalOpex)})</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-primary/30 bg-primary/5 px-3 rounded">
                  <span className="text-lg font-bold">稅前淨利</span>
                  <span className={`text-lg font-bold ${netIncome >= 0 ? "text-success" : "text-destructive"}`}>{formatCurrency(netIncome)}</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Balance Sheet Tab */}
          <TabsContent value="balance">
            <Card className="bg-gradient-card backdrop-blur-sm border-primary/20 p-6">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-6 h-6 text-primary-glow" />
                <h2 className="text-2xl font-bold">資產負債表</h2>
                <Badge variant="outline" className="ml-2">{currentPeriod}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Assets */}
                <div>
                  <h3 className="text-lg font-bold mb-4 text-success">資產</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-primary/10">
                      <span>現金及銀行存款</span>
                      <span className="font-semibold">{formatCurrency(cashBalance)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-primary/10">
                      <span>應收帳款</span>
                      <span className="font-semibold">{formatCurrency(arBalance)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-primary/30 bg-success/5 px-3 rounded">
                      <span className="font-bold">資產合計</span>
                      <span className="font-bold">{formatCurrency(totalAssets)}</span>
                    </div>
                  </div>
                </div>

                {/* Liabilities + Equity */}
                <div>
                  <h3 className="text-lg font-bold mb-4 text-warning">負債與權益</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between py-2 border-b border-primary/10">
                      <span>應付帳款</span>
                      <span className="font-semibold">{formatCurrency(apBalance)}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-primary/10">
                      <span>業主權益</span>
                      <span className="font-semibold">{formatCurrency(equity)}</span>
                    </div>
                    <div className="flex justify-between py-3 border-t-2 border-primary/30 bg-warning/5 px-3 rounded">
                      <span className="font-bold">負債及權益合計</span>
                      <span className="font-bold">{formatCurrency(totalLiabilities + equity)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AccountingReports;
