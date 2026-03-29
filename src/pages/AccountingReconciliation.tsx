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
import { ArrowLeft, Plus, Trash2, CheckCircle, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useBankTransactions, useInvoices, useBills } from "@/hooks/useAccounting";
import type { BankTransaction } from "@/types/accounting";

const AccountingReconciliation = () => {
  const navigate = useNavigate();
  const { data: transactions, loading, insert, update, remove } = useBankTransactions();
  const { data: invoices } = useInvoices();
  const { data: bills } = useBills();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [matchDialog, setMatchDialog] = useState<BankTransaction | null>(null);
  const [filter, setFilter] = useState<"all" | "reconciled" | "unreconciled">("all");
  const [form, setForm] = useState({
    bank_account: "main",
    transaction_date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "credit" as "credit" | "debit",
    reference_number: "",
    notes: "",
  });

  const resetForm = () => setForm({
    bank_account: "main",
    transaction_date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    type: "credit",
    reference_number: "",
    notes: "",
  });

  const handleCreate = async () => {
    await insert({
      bank_account: form.bank_account,
      transaction_date: form.transaction_date,
      description: form.description,
      amount: parseFloat(form.amount) || 0,
      type: form.type,
      reference_number: form.reference_number || null,
      is_reconciled: false,
      notes: form.notes || null,
    } as any);
    setDialogOpen(false);
  };

  const handleAutoReconcile = async () => {
    let matched = 0;
    for (const txn of transactions.filter(t => !t.is_reconciled)) {
      const amt = Math.abs(Number(txn.amount));
      if (txn.type === "credit") {
        const inv = invoices.find(i => Math.abs(Number(i.total_amount) - amt) < 0.01 && (i.status === "sent" || i.status === "overdue"));
        if (inv) {
          await update(txn.id, { is_reconciled: true, matched_invoice_id: inv.id } as any);
          matched++;
        }
      } else {
        const bill = bills.find(b => Math.abs(Number(b.total_amount) - amt) < 0.01 && (b.status === "approved" || b.status === "pending"));
        if (bill) {
          await update(txn.id, { is_reconciled: true, matched_bill_id: bill.id } as any);
          matched++;
        }
      }
    }
    if (matched === 0) {
      alert("未找到可自動匹配的交易");
    }
  };

  const handleManualMatch = async (txn: BankTransaction, type: "invoice" | "bill", id: string) => {
    const updateData: any = { is_reconciled: true };
    if (type === "invoice") updateData.matched_invoice_id = id;
    else updateData.matched_bill_id = id;
    await update(txn.id, updateData);
    setMatchDialog(null);
  };

  const handleMarkReconciled = async (txn: BankTransaction) => {
    await update(txn.id, { is_reconciled: true } as any);
  };

  const filtered = filter === "all" ? transactions
    : filter === "reconciled" ? transactions.filter(t => t.is_reconciled)
    : transactions.filter(t => !t.is_reconciled);

  const formatCurrency = (n: number) => `NT$ ${Number(n).toLocaleString("zh-TW")}`;
  const unreconciledCount = transactions.filter(t => !t.is_reconciled).length;
  const reconciledCount = transactions.filter(t => t.is_reconciled).length;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="border-primary/30" onClick={() => navigate("/accounting")}>
              <ArrowLeft className="mr-2 w-4 h-4" />返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold">銀行對帳</h1>
              <p className="text-muted-foreground">交易匹配與差異調整</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-primary/30" onClick={handleAutoReconcile}>
              <Link2 className="mr-2 w-4 h-4" />自動對帳
            </Button>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-primary hover:shadow-glow">
                  <Plus className="mr-2 w-4 h-4" />新增交易
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader><DialogTitle>新增銀行交易</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>銀行帳戶</Label><Input value={form.bank_account} onChange={e => setForm(f => ({ ...f, bank_account: e.target.value }))} /></div>
                    <div><Label>交易日期</Label><Input type="date" value={form.transaction_date} onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} /></div>
                  </div>
                  <div><Label>描述</Label><Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>金額</Label><Input type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                    <div>
                      <Label>類型</Label>
                      <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as "credit" | "debit" }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credit">存入 (Credit)</SelectItem>
                          <SelectItem value="debit">支出 (Debit)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div><Label>參考編號</Label><Input value={form.reference_number} onChange={e => setForm(f => ({ ...f, reference_number: e.target.value }))} /></div>
                  <div><Label>備註</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
                  <Button className="w-full bg-gradient-primary" onClick={handleCreate}>新增交易</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-gradient-card border-primary/20">
            <p className="text-sm text-muted-foreground">總交易數</p>
            <p className="text-xl font-bold">{transactions.length}</p>
          </Card>
          <Card className="p-4 bg-gradient-card border-primary/20">
            <p className="text-sm text-muted-foreground">已對帳</p>
            <p className="text-xl font-bold text-success">{reconciledCount}</p>
          </Card>
          <Card className="p-4 bg-gradient-card border-primary/20">
            <p className="text-sm text-muted-foreground">未對帳</p>
            <p className="text-xl font-bold text-destructive">{unreconciledCount}</p>
          </Card>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { value: "all" as const, label: "全部" },
            { value: "unreconciled" as const, label: "未對帳" },
            { value: "reconciled" as const, label: "已對帳" },
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
                <TableHead>日期</TableHead>
                <TableHead>描述</TableHead>
                <TableHead>帳戶</TableHead>
                <TableHead>類型</TableHead>
                <TableHead className="text-right">金額</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">載入中...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">尚無交易資料</TableCell></TableRow>
              ) : (
                filtered.map(txn => (
                  <TableRow key={txn.id}>
                    <TableCell>{txn.transaction_date}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{txn.description}</TableCell>
                    <TableCell>{txn.bank_account}</TableCell>
                    <TableCell>
                      <Badge variant={txn.type === "credit" ? "default" : "secondary"}>
                        {txn.type === "credit" ? "存入" : "支出"}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-semibold ${txn.type === "credit" ? "text-success" : "text-destructive"}`}>
                      {txn.type === "credit" ? "+" : "-"}{formatCurrency(Math.abs(Number(txn.amount)))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={txn.is_reconciled ? "outline" : "destructive"}>
                        {txn.is_reconciled ? "已對帳" : "未對帳"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {!txn.is_reconciled && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => setMatchDialog(txn)} title="手動匹配">
                              <Link2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleMarkReconciled(txn)} title="標記已對帳">
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => remove(txn.id)} title="刪除">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>

        {/* Manual Match Dialog */}
        <Dialog open={!!matchDialog} onOpenChange={() => setMatchDialog(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>手動匹配交易</DialogTitle></DialogHeader>
            {matchDialog && (
              <div className="space-y-4">
                <Card className="p-3 bg-background/50">
                  <p className="text-sm">交易: {matchDialog.description}</p>
                  <p className="font-semibold">{formatCurrency(Math.abs(Number(matchDialog.amount)))}</p>
                </Card>
                <div>
                  <Label className="mb-2 block">{matchDialog.type === "credit" ? "匹配發票 (AR)" : "匹配帳單 (AP)"}</Label>
                  {matchDialog.type === "credit" ? (
                    invoices.filter(i => i.status === "sent" || i.status === "overdue").length === 0 ? (
                      <p className="text-sm text-muted-foreground">無可匹配的發票</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {invoices.filter(i => i.status === "sent" || i.status === "overdue").map(inv => (
                          <Card key={inv.id} className="p-3 flex justify-between items-center hover:bg-primary/5 cursor-pointer" onClick={() => handleManualMatch(matchDialog, "invoice", inv.id)}>
                            <div>
                              <p className="font-mono text-sm">{inv.invoice_number}</p>
                              <p className="text-xs text-muted-foreground">到期: {inv.due_date}</p>
                            </div>
                            <p className="font-semibold">{formatCurrency(inv.total_amount)}</p>
                          </Card>
                        ))}
                      </div>
                    )
                  ) : (
                    bills.filter(b => b.status === "approved" || b.status === "pending").length === 0 ? (
                      <p className="text-sm text-muted-foreground">無可匹配的帳單</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {bills.filter(b => b.status === "approved" || b.status === "pending").map(bill => (
                          <Card key={bill.id} className="p-3 flex justify-between items-center hover:bg-primary/5 cursor-pointer" onClick={() => handleManualMatch(matchDialog, "bill", bill.id)}>
                            <div>
                              <p className="font-mono text-sm">{bill.bill_number}</p>
                              <p className="text-xs text-muted-foreground">到期: {bill.due_date}</p>
                            </div>
                            <p className="font-semibold">{formatCurrency(bill.total_amount)}</p>
                          </Card>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AccountingReconciliation;
