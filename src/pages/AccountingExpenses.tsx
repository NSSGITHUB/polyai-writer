import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Plus, Trash2, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useExpenses } from "@/hooks/useAccounting";
import { EXPENSE_CATEGORIES, type Expense } from "@/types/accounting";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待審核", variant: "secondary" },
  approved: { label: "已核准", variant: "default" },
  rejected: { label: "已駁回", variant: "destructive" },
  paid: { label: "已付款", variant: "outline" },
};

const AccountingExpenses = () => {
  const navigate = useNavigate();
  const { data: expenses, loading, insert, update, remove } = useExpenses();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    employee_name: "",
    category: "",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    receipt_url: "",
    notes: "",
  });

  const resetForm = () => setForm({
    employee_name: "",
    category: "",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    receipt_url: "",
    notes: "",
  });

  const handleCreate = async () => {
    await insert({
      employee_name: form.employee_name,
      category: form.category,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      expense_date: form.expense_date,
      receipt_url: form.receipt_url || null,
      status: "pending",
      notes: form.notes || null,
    } as any);
    setDialogOpen(false);
  };

  const handleApprove = async (exp: Expense) => {
    await update(exp.id, { status: "approved", approved_by: "Admin", approved_at: new Date().toISOString() } as any);
  };

  const handleReject = async (exp: Expense) => {
    await update(exp.id, { status: "rejected" } as any);
  };

  const handlePay = async (exp: Expense) => {
    await update(exp.id, { status: "paid", payment_date: new Date().toISOString().split("T")[0] } as any);
  };

  const filtered = filter === "all" ? expenses : expenses.filter(e => e.status === filter);
  const formatCurrency = (n: number) => `NT$ ${Number(n).toLocaleString("zh-TW")}`;

  const totalPending = expenses.filter(e => e.status === "pending").reduce((s, e) => s + Number(e.amount), 0);
  const totalApproved = expenses.filter(e => e.status === "approved").reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="border-primary/30" onClick={() => navigate("/accounting")}>
              <ArrowLeft className="mr-2 w-4 h-4" />返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold">費用報銷</h1>
              <p className="text-muted-foreground">員工費用提交、審核與付款</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:shadow-glow">
                <Plus className="mr-2 w-4 h-4" />提交報銷
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>提交費用報銷</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>員工姓名</Label><Input value={form.employee_name} onChange={e => setForm(f => ({ ...f, employee_name: e.target.value }))} /></div>
                  <div>
                    <Label>費用類別</Label>
                    <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue placeholder="選擇類別" /></SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label>說明</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>金額</Label><Input type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                  <div><Label>消費日期</Label><Input type="date" value={form.expense_date} onChange={e => setForm(f => ({ ...f, expense_date: e.target.value }))} /></div>
                </div>
                <div><Label>收據連結 (選填)</Label><Input placeholder="https://..." value={form.receipt_url} onChange={e => setForm(f => ({ ...f, receipt_url: e.target.value }))} /></div>
                <div><Label>備註</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button className="w-full bg-gradient-primary" onClick={handleCreate}>提交報銷</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-gradient-card border-primary/20">
            <p className="text-sm text-muted-foreground">待審核金額</p>
            <p className="text-xl font-bold">{formatCurrency(totalPending)}</p>
          </Card>
          <Card className="p-4 bg-gradient-card border-primary/20">
            <p className="text-sm text-muted-foreground">已核准待付</p>
            <p className="text-xl font-bold">{formatCurrency(totalApproved)}</p>
          </Card>
          <Card className="p-4 bg-gradient-card border-primary/20">
            <p className="text-sm text-muted-foreground">本月報銷筆數</p>
            <p className="text-xl font-bold">{expenses.length}</p>
          </Card>
          <Card className="p-4 bg-gradient-card border-primary/20">
            <p className="text-sm text-muted-foreground">待審核筆數</p>
            <p className="text-xl font-bold">{expenses.filter(e => e.status === "pending").length}</p>
          </Card>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { value: "all", label: "全部" },
            { value: "pending", label: "待審核" },
            { value: "approved", label: "已核准" },
            { value: "rejected", label: "已駁回" },
            { value: "paid", label: "已付款" },
          ].map(f => (
            <Button key={f.value} variant={filter === f.value ? "default" : "outline"} size="sm" onClick={() => setFilter(f.value)}>
              {f.label}
            </Button>
          ))}
        </div>

        <Card className="bg-gradient-card backdrop-blur-sm border-primary/20">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>員工</TableHead>
                <TableHead>類別</TableHead>
                <TableHead>說明</TableHead>
                <TableHead>消費日期</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">尚無報銷資料</TableCell></TableRow>
              ) : (
                filtered.map(exp => {
                  const st = statusMap[exp.status] || statusMap.pending;
                  return (
                    <TableRow key={exp.id}>
                      <TableCell>{exp.employee_name}</TableCell>
                      <TableCell>{exp.category}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{exp.description}</TableCell>
                      <TableCell>{exp.expense_date}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(exp.amount)}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {exp.status === "pending" && (
                            <>
                              <Button variant="ghost" size="sm" onClick={() => handleApprove(exp)} title="核准">
                                <CheckCircle className="w-4 h-4 text-success" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleReject(exp)} title="駁回">
                                <XCircle className="w-4 h-4 text-destructive" />
                              </Button>
                            </>
                          )}
                          {exp.status === "approved" && (
                            <Button variant="ghost" size="sm" onClick={() => handlePay(exp)} title="付款">
                              <DollarSign className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => remove(exp.id)} title="刪除">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default AccountingExpenses;
