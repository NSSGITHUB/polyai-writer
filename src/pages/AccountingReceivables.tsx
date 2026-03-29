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
import { ArrowLeft, Plus, Trash2, Send, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useInvoices, useCustomers } from "@/hooks/useAccounting";
import type { Invoice } from "@/types/accounting";

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  draft: { label: "草稿", variant: "secondary" },
  sent: { label: "已寄送", variant: "default" },
  paid: { label: "已收款", variant: "outline" },
  overdue: { label: "逾期", variant: "destructive" },
  cancelled: { label: "已取消", variant: "secondary" },
};

const AccountingReceivables = () => {
  const navigate = useNavigate();
  const { data: invoices, loading, insert, update, remove } = useInvoices();
  const { data: customers } = useCustomers();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    invoice_number: "",
    customer_id: "",
    issue_date: new Date().toISOString().split("T")[0],
    due_date: "",
    subtotal: "",
    tax_rate: "5",
    notes: "",
  });

  const resetForm = () => {
    const now = new Date();
    const due = new Date(now);
    due.setDate(due.getDate() + 30);
    setForm({
      invoice_number: `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(invoices.length + 1).padStart(3, "0")}`,
      customer_id: "",
      issue_date: now.toISOString().split("T")[0],
      due_date: due.toISOString().split("T")[0],
      subtotal: "",
      tax_rate: "5",
      notes: "",
    });
  };

  const handleCreate = async () => {
    const subtotal = parseFloat(form.subtotal) || 0;
    const taxRate = parseFloat(form.tax_rate) || 0;
    const taxAmount = Math.round(subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    await insert({
      invoice_number: form.invoice_number,
      customer_id: form.customer_id || null,
      issue_date: form.issue_date,
      due_date: form.due_date,
      subtotal,
      tax_rate: taxRate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      paid_amount: 0,
      status: "draft",
      notes: form.notes || null,
    } as any);
    setDialogOpen(false);
  };

  const handleMarkSent = async (inv: Invoice) => {
    await update(inv.id, { status: "sent" } as any);
  };

  const handleMarkPaid = async (inv: Invoice) => {
    await update(inv.id, { status: "paid", paid_amount: inv.total_amount } as any);
  };

  const filtered = filter === "all" ? invoices : invoices.filter(i => i.status === filter);
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
              <h1 className="text-3xl font-bold">應收帳款 (AR)</h1>
              <p className="text-muted-foreground">管理發票、收款與催款</p>
            </div>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:shadow-glow">
                <Plus className="mr-2 w-4 h-4" />新增發票
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>新增發票</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>發票編號</Label><Input value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} /></div>
                  <div>
                    <Label>客戶</Label>
                    <Select value={form.customer_id} onValueChange={v => setForm(f => ({ ...f, customer_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="選擇客戶" /></SelectTrigger>
                      <SelectContent>
                        {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>開立日期</Label><Input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))} /></div>
                  <div><Label>到期日</Label><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>小計金額</Label><Input type="number" placeholder="0" value={form.subtotal} onChange={e => setForm(f => ({ ...f, subtotal: e.target.value }))} /></div>
                  <div><Label>稅率 (%)</Label><Input type="number" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: e.target.value }))} /></div>
                </div>
                <div><Label>備註</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                <Button className="w-full bg-gradient-primary" onClick={handleCreate}>建立發票</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="flex gap-2 mb-6">
          {[
            { value: "all", label: "全部" },
            { value: "draft", label: "草稿" },
            { value: "sent", label: "已寄送" },
            { value: "overdue", label: "逾期" },
            { value: "paid", label: "已收款" },
          ].map(f => (
            <Button key={f.value} variant={filter === f.value ? "default" : "outline"} size="sm" onClick={() => setFilter(f.value)}>
              {f.label}
            </Button>
          ))}
        </div>

        {/* Table */}
        <Card className="bg-gradient-card backdrop-blur-sm border-primary/20">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>發票編號</TableHead>
                <TableHead>開立日期</TableHead>
                <TableHead>到期日</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead className="text-right">已收</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">尚無發票資料</TableCell></TableRow>
              ) : (
                filtered.map(inv => {
                  const st = statusMap[inv.status] || statusMap.draft;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.issue_date}</TableCell>
                      <TableCell>{inv.due_date}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(inv.total_amount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(inv.paid_amount)}</TableCell>
                      <TableCell><Badge variant={st.variant}>{st.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {inv.status === "draft" && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkSent(inv)} title="標記已寄送">
                              <Send className="w-4 h-4" />
                            </Button>
                          )}
                          {(inv.status === "sent" || inv.status === "overdue") && (
                            <Button variant="ghost" size="sm" onClick={() => handleMarkPaid(inv)} title="標記已收款">
                              <DollarSign className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => remove(inv.id)} title="刪除">
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

export default AccountingReceivables;
