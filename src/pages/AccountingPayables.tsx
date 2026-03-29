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
import { ArrowLeft, Plus, Trash2, CheckCircle, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBills, useSuppliers } from "@/hooks/useAccounting";
import { BILL_CATEGORIES, type Bill } from "@/types/accounting";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "待審核", variant: "secondary" },
  approved: { label: "已核准", variant: "default" },
  paid: { label: "已付款", variant: "outline" },
  overdue: { label: "逾期", variant: "destructive" },
  cancelled: { label: "已取消", variant: "secondary" },
};

const AccountingPayables = () => {
  const navigate = useNavigate();
  const { data: bills, loading, insert, update, remove } = useBills();
  const { data: suppliers } = useSuppliers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    bill_number: "",
    supplier_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    subtotal: "",
    tax_rate: "5",
    category: "",
    notes: "",
  });

  const resetForm = () => {
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 30);
    setForm({
      bill_number: `BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(bills.length + 1).padStart(3, "0")}`,
      supplier_id: "",
      issue_date: now.toISOString().split("T")[0],
      due_date: due.toISOString().split("T")[0],
      subtotal: "",
      tax_rate: "5",
      category: "",
      notes: "",
    });
  };

  const handleCreate = async () => {
    const subtotal = parseFloat(form.subtotal) || 0;
    const taxRate = parseFloat(form.tax_rate) || 0;
    const taxAmount = Math.round(subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;
    await insert({
      bill_number: form.bill_number,
      supplier_id: form.supplier_id || null,
      issue_date: form.issue_date,
      due_date: form.due_date,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      paid_amount: 0,
      status: "pending",
      category: form.category || null,
      notes: form.notes || null,
    } as any);
    setDialogOpen(false);
  };

  const handleApprove = async (bill: Bill) => {
    await update(bill.id, { status: "approved" } as any);
  };

  const handleMarkPaid = async (bill: Bill) => {
    await update(bill.id, { status: "paid", paid_amount: bill.total_amount } as any);
  };

  const filtered = filter === "all" ? bills : bills.filter(b => b.status === filter);
  const formatCurrency = (n: number) => `NT$ ${Number(n).toLocaleString("zh-TW")}`;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="border-primary/30" onClick={() => navigate("/accounting")}>
              <ArrowLeft className="mr-2 w-4 h-4" />返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold">應付帳款 (AP)</h1>
              <p className="text-muted-foreground">供應商帳單管理、審核與付款</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:shadow-glow">
                <Plus className="mr-2 w-4 h-4" />新增帳單
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>新增應付帳單</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>帳單編號</Label><Input value={form.bill_number} onChange={e => setForm(f => ({ ...f, bill_number: e.target.value }))} /></div>
                  <div>
                    <Label>供應商</Label>
                    <Select value={form.supplier_id} onValueChange={v => setForm(f => ({ ...f, supplier_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="選擇供應商" /></SelectTrigger>
                      <SelectContent>
                        {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>開立日期</Label><Input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} /></div>
                  <div><Label>到期日</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>金額</Label><Input type="number" placeholder="0" value={form.subtotal} onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))} /></div>
                  <div><Label>稅率 (%)</Label><Input type="number" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))} /></div>
                </div>
                <div>
                  <Label>類別</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue placeholder="選擇類別" /></SelectTrigger>
                    <SelectContent>
                      {BILL_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>備註</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button className="w-full bg-gradient-primary" onClick={handleCreate}>建立帳單</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { value: "all", label: "全部" },
            { value: "pending", label: "待審核" },
            { value: "approved", label: "已核准" },
            { value: "overdue", label: "逾期" },
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
                <TableHead>帳單編號</TableHead>
                <TableHead>類別</TableHead>
                <TableHead>開立日期</TableHead>
                <TableHead>到期日</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">尚無帳單資料</TableCell></TableRow>
              ) : (
                filtered.map(bill => {
                  const st = statusMap[bill.status] || statusMap.pending;
                  return (
                    <TableRow key={bill.id}>
                      <TableCell className="font-mono">{bill.bill_number}</TableCell>
                      <TableCell>{bill.category || "-"}</TableCell>
                      <TableCell>{bill.issue_date}</TableCell>
                      <TableCell>{bill.due_date}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(bill.total_amount)}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {bill.status === "pending" && (
                            <Button variant="ghost" size="sm" onClick={() => handleApprove(bill)} title="核准">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          {bill.status === "approved" && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(bill)} title="標記已付款">
                              <DollarSign className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => remove(bill.id)} title="刪除">
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

export default AccountingPayables;
