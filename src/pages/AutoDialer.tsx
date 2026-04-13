import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneMissed,
  Plus,
  Upload,
  ArrowLeft,
  Settings,
  Loader2,
  Trash2,
  Play,
  Square,
  Users,
  BarChart3,
  Mail,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import { getSipService, formatDuration, formatTWPhoneNumber } from "@/lib/sip-service";
import type { CallState, SipConfig } from "@/lib/sip-service";

interface Contact {
  id: number;
  name: string;
  phone: string;
  company: string | null;
  email: string | null;
  notes: string | null;
  tags: string | null;
  status: string;
  last_called_at: string | null;
  call_count: number;
}

interface CallStats {
  total_calls: number;
  completed_calls: number;
  answered_calls: number;
  avg_duration: number;
  today_calls: number;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "待撥", color: "bg-gray-500" },
  called: { label: "已撥", color: "bg-blue-500" },
  answered: { label: "已接聽", color: "bg-green-500" },
  no_answer: { label: "未接", color: "bg-yellow-500" },
  busy: { label: "忙線", color: "bg-orange-500" },
  failed: { label: "失敗", color: "bg-red-500" },
  callback: { label: "回撥", color: "bg-purple-500" },
  converted: { label: "已轉換", color: "bg-emerald-500" },
};

const AutoDialer = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userId, setUserId] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [callStats, setCallStats] = useState<CallStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sipConnected, setSipConnected] = useState(false);
  const [sipConnecting, setSipConnecting] = useState(false);
  const [callState, setCallState] = useState<CallState | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [isAutoDialing, setIsAutoDialing] = useState(false);
  const [autoDialIndex, setAutoDialIndex] = useState(0);

  // 新增聯絡人 dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    company: "",
    email: "",
    notes: "",
  });

  // 批次匯入 dialog
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/auth");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      setUserId(user.id);
      fetchContacts(user.id);
      fetchCallStats(user.id);
    } catch {
      navigate("/auth");
    }
  }, [navigate]);

  const fetchContacts = async (uid: string, status?: string) => {
    setIsLoading(true);
    try {
      const statusParam = status ? `&status=${status}` : "";
      const response = await fetch(
        `${API_BASE_URL}/dial-contacts.php?user_id=${uid}&limit=100${statusParam}`
      );
      const data = await response.json();
      if (data.success) {
        setContacts(data.data || []);
        setStatusCounts(data.status_counts || {});
      }
    } catch (error) {
      console.error("載入聯絡人失敗:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCallStats = async (uid: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/call-logs.php?user_id=${uid}&limit=1`);
      const data = await response.json();
      if (data.success && data.stats) {
        setCallStats(data.stats);
      }
    } catch (error) {
      console.error("載入通話統計失敗:", error);
    }
  };

  // SIP 連線
  const handleConnectSip = async () => {
    setSipConnecting(true);
    try {
      // 取得 SIP 設定（需要真實密碼，這裡從 API 取得）
      const response = await fetch(`${API_BASE_URL}/sip-settings.php?user_id=${userId}`);
      const data = await response.json();
      if (!data.success || !data.data) {
        toast({
          title: "SIP 未設定",
          description: "請先到 SIP 設定頁面填寫中華電信 SIP 帳號",
          variant: "destructive",
        });
        navigate("/sip-settings");
        return;
      }

      const sipService = getSipService();
      sipService.setEventHandlers({
        onRegistered: () => {
          setSipConnected(true);
          setSipConnecting(false);
          toast({ title: "SIP 已連線", description: "已成功連接到 SIP 伺服器，可以開始撥號" });
        },
        onUnregistered: () => {
          setSipConnected(false);
          setIsAutoDialing(false);
        },
        onRegistrationFailed: (error) => {
          setSipConnected(false);
          setSipConnecting(false);
          toast({ title: "SIP 連線失敗", description: error, variant: "destructive" });
        },
        onCallStateChanged: (state) => {
          setCallState(state);
          if (state.status === "ended" || state.status === "failed") {
            // 更新聯絡人狀態
            handleCallEnded(state);
          }
        },
      });

      const settings = data.data;
      const config: SipConfig = {
        sipServer: settings.sip_server,
        sipPort: parseInt(settings.sip_port),
        sipUsername: settings.sip_username,
        sipPassword: settings.sip_password,
        sipDomain: settings.sip_domain || settings.sip_server,
        displayName: settings.display_name || "",
        callerId: settings.caller_id || "",
        transport: settings.transport || "wss",
        stunServer: settings.stun_server || "stun:stun.l.google.com:19302",
      };

      await sipService.initialize(config);
    } catch (error: any) {
      setSipConnecting(false);
      toast({ title: "連線失敗", description: error.message, variant: "destructive" });
    }
  };

  const handleDisconnectSip = async () => {
    setIsAutoDialing(false);
    const sipService = getSipService();
    await sipService.disconnect();
    setSipConnected(false);
    setCallState(null);
  };

  // 撥打電話
  const handleMakeCall = async (contact: Contact) => {
    if (!sipConnected) {
      toast({ title: "未連線", description: "請先連接 SIP 服務", variant: "destructive" });
      return;
    }

    try {
      // 建立通話記錄
      await fetch(`${API_BASE_URL}/call-logs.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          contact_id: contact.id,
          phone_number: contact.phone,
          direction: "outbound",
        }),
      });

      const sipService = getSipService();
      const formattedPhone = formatTWPhoneNumber(contact.phone);
      await sipService.makeCall(formattedPhone);
    } catch (error: any) {
      toast({ title: "撥號失敗", description: error.message, variant: "destructive" });
    }
  };

  // 掛斷
  const handleHangup = async () => {
    const sipService = getSipService();
    await sipService.hangup();
  };

  // 通話結束更新
  const handleCallEnded = useCallback(
    async (state: CallState) => {
      const contactStatus =
        state.status === "ended" && state.duration > 0 ? "answered" : "no_answer";

      // 更新聯絡人狀態
      const currentContact = contacts.find((c) => {
        const formatted = formatTWPhoneNumber(c.phone);
        return formatted === state.phoneNumber || c.phone === state.phoneNumber;
      });

      if (currentContact) {
        await fetch(`${API_BASE_URL}/dial-contacts.php`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: currentContact.id,
            user_id: userId,
            status: contactStatus,
          }),
        });
        fetchContacts(userId, filterStatus);
      }

      fetchCallStats(userId);
    },
    [contacts, userId, filterStatus]
  );

  // 自動撥號
  const handleStartAutoDial = () => {
    const pendingContacts = contacts.filter((c) => c.status === "pending");
    if (pendingContacts.length === 0) {
      toast({ title: "沒有待撥聯絡人", description: "所有聯絡人都已撥打過", variant: "destructive" });
      return;
    }
    setIsAutoDialing(true);
    setAutoDialIndex(0);
    handleMakeCall(pendingContacts[0]);
  };

  const handleStopAutoDial = () => {
    setIsAutoDialing(false);
    handleHangup();
  };

  // 新增聯絡人
  const handleAddContact = async () => {
    if (!newContact.phone) {
      toast({ title: "錯誤", description: "請填寫電話號碼", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/dial-contacts.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, ...newContact }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "成功", description: "聯絡人已新增" });
        setShowAddDialog(false);
        setNewContact({ name: "", phone: "", company: "", email: "", notes: "" });
        fetchContacts(userId, filterStatus);
      }
    } catch (error) {
      toast({ title: "錯誤", description: "新增失敗", variant: "destructive" });
    }
  };

  // 批次匯入（格式：姓名,電話,公司 每行一筆）
  const handleImport = async () => {
    const lines = importText.trim().split("\n").filter(Boolean);
    if (lines.length === 0) {
      toast({ title: "錯誤", description: "請輸入聯絡人資料", variant: "destructive" });
      return;
    }

    const importContacts = lines.map((line) => {
      const parts = line.split(",").map((s) => s.trim());
      return {
        name: parts[0] || "未命名",
        phone: parts[1] || parts[0],
        company: parts[2] || null,
        email: parts[3] || null,
      };
    });

    try {
      const response = await fetch(`${API_BASE_URL}/dial-contacts.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, contacts: importContacts }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "成功", description: data.message });
        setShowImportDialog(false);
        setImportText("");
        fetchContacts(userId, filterStatus);
      }
    } catch (error) {
      toast({ title: "錯誤", description: "匯入失敗", variant: "destructive" });
    }
  };

  // 刪除聯絡人
  const handleDeleteContact = async (id: number) => {
    try {
      await fetch(`${API_BASE_URL}/dial-contacts.php`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, user_id: userId }),
      });
      fetchContacts(userId, filterStatus);
    } catch (error) {
      toast({ title: "錯誤", description: "刪除失敗", variant: "destructive" });
    }
  };

  const totalContacts = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <PhoneCall className="w-8 h-8 text-primary" />
                AI 自動撥號
              </h1>
              <p className="text-muted-foreground mt-1">
                使用中華電信 SIP 服務自動撥號開發客戶
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-primary/30"
              onClick={() => navigate("/sip-settings")}
            >
              <Settings className="w-4 h-4 mr-2" />
              SIP 設定
            </Button>
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card className="p-4 bg-gradient-card border-primary/20">
            <div className="text-sm text-muted-foreground">聯絡人總數</div>
            <div className="text-2xl font-bold">{totalContacts}</div>
          </Card>
          <Card className="p-4 bg-gradient-card border-primary/20">
            <div className="text-sm text-muted-foreground">待撥</div>
            <div className="text-2xl font-bold text-yellow-400">
              {statusCounts.pending || 0}
            </div>
          </Card>
          <Card className="p-4 bg-gradient-card border-primary/20">
            <div className="text-sm text-muted-foreground">已接聽</div>
            <div className="text-2xl font-bold text-green-400">
              {statusCounts.answered || 0}
            </div>
          </Card>
          <Card className="p-4 bg-gradient-card border-primary/20">
            <div className="text-sm text-muted-foreground">今日撥打</div>
            <div className="text-2xl font-bold text-blue-400">
              {callStats?.today_calls || 0}
            </div>
          </Card>
          <Card className="p-4 bg-gradient-card border-primary/20">
            <div className="text-sm text-muted-foreground">已轉換</div>
            <div className="text-2xl font-bold text-emerald-400">
              {statusCounts.converted || 0}
            </div>
          </Card>
        </div>

        {/* SIP 連線 & 自動撥號控制 */}
        <Card className="p-4 mb-6 bg-gradient-card border-primary/20">
          <div className="flex flex-wrap items-center gap-4">
            {/* SIP 連線狀態 */}
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  sipConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                }`}
              />
              <span className="text-sm">
                {sipConnected ? "SIP 已連線" : sipConnecting ? "連線中..." : "SIP 未連線"}
              </span>
            </div>

            {!sipConnected ? (
              <Button
                onClick={handleConnectSip}
                disabled={sipConnecting}
                className="bg-green-600 hover:bg-green-700"
              >
                {sipConnecting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Phone className="w-4 h-4 mr-2" />
                )}
                連接 SIP
              </Button>
            ) : (
              <>
                <Button
                  onClick={handleDisconnectSip}
                  variant="outline"
                  className="border-red-500/30 text-red-400"
                >
                  <PhoneOff className="w-4 h-4 mr-2" />
                  斷開連線
                </Button>

                {!isAutoDialing ? (
                  <Button
                    onClick={handleStartAutoDial}
                    className="bg-gradient-primary hover:shadow-glow"
                    disabled={!!callState && callState.status !== "idle" && callState.status !== "ended"}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    AI 自動撥號 ({statusCounts.pending || 0})
                  </Button>
                ) : (
                  <Button onClick={handleStopAutoDial} variant="destructive">
                    <Square className="w-4 h-4 mr-2" />
                    停止自動撥號
                  </Button>
                )}
              </>
            )}

            {/* 通話中狀態 */}
            {callState && callState.status !== "idle" && callState.status !== "ended" && (
              <div className="flex items-center gap-3 ml-auto">
                <Badge className="bg-green-500 animate-pulse">
                  {callState.status === "connecting"
                    ? "撥號中"
                    : callState.status === "ringing"
                    ? "響鈴中"
                    : callState.status === "answered"
                    ? `通話中 ${formatDuration(callState.duration)}`
                    : callState.status}
                </Badge>
                <span className="text-sm">{callState.phoneNumber}</span>
                <Button
                  onClick={handleHangup}
                  size="sm"
                  variant="destructive"
                >
                  <PhoneOff className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* 操作列 */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {/* 狀態篩選 */}
          <Select
            value={filterStatus}
            onValueChange={(v) => {
              const val = v === "all" ? "" : v;
              setFilterStatus(val);
              fetchContacts(userId, val);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="全部狀態" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部狀態</SelectItem>
              {Object.entries(STATUS_MAP).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label} ({statusCounts[key] || 0})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex gap-2">
            {/* 新增聯絡人 */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/30">
                  <UserPlus className="w-4 h-4 mr-2" />
                  新增聯絡人
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>新增撥號聯絡人</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>姓名</Label>
                    <Input
                      value={newContact.name}
                      onChange={(e) =>
                        setNewContact((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="聯絡人姓名"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>電話 *</Label>
                    <Input
                      value={newContact.phone}
                      onChange={(e) =>
                        setNewContact((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="02-XXXX-XXXX 或 09XX-XXX-XXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>公司</Label>
                    <Input
                      value={newContact.company}
                      onChange={(e) =>
                        setNewContact((p) => ({ ...p, company: e.target.value }))
                      }
                      placeholder="公司名稱"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      value={newContact.email}
                      onChange={(e) =>
                        setNewContact((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>備註</Label>
                    <Textarea
                      value={newContact.notes}
                      onChange={(e) =>
                        setNewContact((p) => ({ ...p, notes: e.target.value }))
                      }
                      placeholder="備註資訊"
                    />
                  </div>
                  <Button onClick={handleAddContact} className="w-full bg-gradient-primary">
                    新增
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* 批次匯入 */}
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-primary/30">
                  <Upload className="w-4 h-4 mr-2" />
                  批次匯入
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>批次匯入聯絡人</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <p className="text-sm text-muted-foreground">
                    每行一筆，格式：<code>姓名,電話,公司,Email</code>
                  </p>
                  <Textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={`王大明,02-2345-6789,台灣公司,wang@example.com\n李小華,0912-345-678,科技公司,lee@example.com`}
                    rows={10}
                  />
                  <Button onClick={handleImport} className="w-full bg-gradient-primary">
                    匯入 ({importText.trim().split("\n").filter(Boolean).length} 筆)
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* 聯絡人列表 */}
        <Card className="bg-gradient-card border-primary/20 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="mb-2">還沒有聯絡人</p>
              <p className="text-sm">點擊「新增聯絡人」或「批次匯入」開始</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>電話</TableHead>
                    <TableHead>公司</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>撥打次數</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact, index) => {
                    const statusInfo = STATUS_MAP[contact.status] || STATUS_MAP.pending;
                    return (
                      <TableRow key={contact.id}>
                        <TableCell className="text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium">{contact.name}</TableCell>
                        <TableCell>{contact.phone}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {contact.company || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusInfo.color} text-white text-xs`}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{contact.call_count}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {contact.email && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="發送 Email"
                                onClick={() =>
                                  window.open(`mailto:${contact.email}`)
                                }
                              >
                                <Mail className="w-4 h-4 text-blue-400" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="撥打電話"
                              disabled={!sipConnected}
                              onClick={() => handleMakeCall(contact)}
                            >
                              <Phone className="w-4 h-4 text-green-400" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="刪除"
                              onClick={() => handleDeleteContact(contact.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AutoDialer;
