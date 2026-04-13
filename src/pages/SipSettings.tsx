import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone,
  Settings,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Info,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";
import { getSipService, DEFAULT_CHT_CONFIG } from "@/lib/sip-service";
import type { SipConfig } from "@/lib/sip-service";

const SipSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<"idle" | "success" | "failed">("idle");
  const [userId, setUserId] = useState("");

  const [config, setConfig] = useState<SipConfig>({
    sipServer: DEFAULT_CHT_CONFIG.sipServer!,
    sipPort: DEFAULT_CHT_CONFIG.sipPort!,
    sipUsername: "",
    sipPassword: "",
    sipDomain: DEFAULT_CHT_CONFIG.sipDomain!,
    displayName: "",
    callerId: "",
    transport: DEFAULT_CHT_CONFIG.transport!,
    stunServer: DEFAULT_CHT_CONFIG.stunServer!,
  });

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/auth");
      return;
    }
    try {
      const user = JSON.parse(userStr);
      setUserId(user.id);
      fetchSettings(user.id);
    } catch {
      navigate("/auth");
    }
  }, [navigate]);

  const fetchSettings = async (uid: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sip-settings.php?user_id=${uid}`);
      const data = await response.json();
      if (data.success && data.data) {
        setConfig({
          sipServer: data.data.sip_server || DEFAULT_CHT_CONFIG.sipServer!,
          sipPort: parseInt(data.data.sip_port) || DEFAULT_CHT_CONFIG.sipPort!,
          sipUsername: data.data.sip_username || "",
          sipPassword: data.data.sip_password || "",
          sipDomain: data.data.sip_domain || DEFAULT_CHT_CONFIG.sipDomain!,
          displayName: data.data.display_name || "",
          callerId: data.data.caller_id || "",
          transport: data.data.transport || DEFAULT_CHT_CONFIG.transport!,
          stunServer: data.data.stun_server || DEFAULT_CHT_CONFIG.stunServer!,
        });
      }
    } catch (error) {
      console.error("載入 SIP 設定失敗:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config.sipUsername) {
      toast({ title: "錯誤", description: "請填寫 SIP 帳號", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE_URL}/sip-settings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          sip_server: config.sipServer,
          sip_port: config.sipPort,
          sip_username: config.sipUsername,
          sip_password: config.sipPassword,
          sip_domain: config.sipDomain,
          display_name: config.displayName,
          caller_id: config.callerId,
          transport: config.transport,
          stun_server: config.stunServer,
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "成功", description: "SIP 設定已儲存" });
      } else {
        toast({ title: "錯誤", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "錯誤", description: "儲存失敗", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.sipUsername || !config.sipPassword || config.sipPassword.match(/^\*+$/)) {
      toast({
        title: "無法測試",
        description: "請先填寫完整的 SIP 帳號和密碼再進行測試",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setTestStatus("idle");
    const sipService = getSipService();

    sipService.setEventHandlers({
      onRegistered: () => {
        setTestStatus("success");
        setIsTesting(false);
        toast({ title: "連線成功", description: "已成功連接到中華電信 SIP 伺服器" });
        sipService.disconnect();
      },
      onRegistrationFailed: (error) => {
        setTestStatus("failed");
        setIsTesting(false);
        toast({
          title: "連線失敗",
          description: `SIP 註冊失敗: ${error}`,
          variant: "destructive",
        });
      },
    });

    try {
      await sipService.initialize(config);
    } catch (error: any) {
      setTestStatus("failed");
      setIsTesting(false);
      toast({
        title: "連線失敗",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateConfig = (field: keyof SipConfig, value: string | number) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
    setTestStatus("idle");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="w-8 h-8 text-primary" />
              SIP 電話設定
            </h1>
            <p className="text-muted-foreground mt-1">
              設定中華電信 SIP 服務，啟用 AI 自動撥號功能
            </p>
          </div>
        </div>

        {/* 說明卡片 */}
        <Card className="p-4 mb-6 bg-blue-500/10 border-blue-500/30">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-200">
              <p className="font-semibold mb-1">中華電信 SIP 服務設定說明</p>
              <ul className="list-disc list-inside space-y-1 text-blue-300">
                <li>請先向中華電信申請 SIP trunk 服務或 HiNet VoIP 帳號</li>
                <li>取得 SIP 帳號、密碼後填入下方表單</li>
                <li>SIP 伺服器位址通常為 <code className="bg-blue-500/20 px-1 rounded">sip.hinet.net</code></li>
                <li>需要搭配 WebSocket SIP 代理伺服器（如 Obeycent / Kamailio / Asterisk）</li>
                <li>來電顯示號碼為中華電信核配的門號</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* SIP 設定表單 */}
        <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Phone className="w-5 h-5 text-primary" />
            SIP 連線設定
          </h2>

          <div className="space-y-6">
            {/* 基本連線 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sipServer">SIP 伺服器</Label>
                <Input
                  id="sipServer"
                  value={config.sipServer}
                  onChange={(e) => updateConfig("sipServer", e.target.value)}
                  placeholder="sip.hinet.net"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sipPort">埠號</Label>
                <Input
                  id="sipPort"
                  type="number"
                  value={config.sipPort}
                  onChange={(e) => updateConfig("sipPort", parseInt(e.target.value) || 5060)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sipUsername">SIP 帳號</Label>
                <Input
                  id="sipUsername"
                  value={config.sipUsername}
                  onChange={(e) => updateConfig("sipUsername", e.target.value)}
                  placeholder="中華電信分配的 SIP 帳號"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sipPassword">SIP 密碼</Label>
                <Input
                  id="sipPassword"
                  type="password"
                  value={config.sipPassword}
                  onChange={(e) => updateConfig("sipPassword", e.target.value)}
                  placeholder="SIP 驗證密碼"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sipDomain">SIP 域名</Label>
                <Input
                  id="sipDomain"
                  value={config.sipDomain}
                  onChange={(e) => updateConfig("sipDomain", e.target.value)}
                  placeholder="hinet.net"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="transport">傳輸協議</Label>
                <Select
                  value={config.transport}
                  onValueChange={(v) => updateConfig("transport", v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wss">WSS (WebSocket Secure)</SelectItem>
                    <SelectItem value="ws">WS (WebSocket)</SelectItem>
                    <SelectItem value="tcp">TCP</SelectItem>
                    <SelectItem value="udp">UDP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 來電顯示 */}
            <div className="border-t border-primary/10 pt-4">
              <h3 className="text-lg font-medium mb-4">來電顯示</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">顯示名稱</Label>
                  <Input
                    id="displayName"
                    value={config.displayName}
                    onChange={(e) => updateConfig("displayName", e.target.value)}
                    placeholder="您的公司名稱"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="callerId">來電顯示號碼</Label>
                  <Input
                    id="callerId"
                    value={config.callerId}
                    onChange={(e) => updateConfig("callerId", e.target.value)}
                    placeholder="02-XXXX-XXXX 或 09XX-XXX-XXX"
                  />
                </div>
              </div>
            </div>

            {/* 進階設定 */}
            <div className="border-t border-primary/10 pt-4">
              <h3 className="text-lg font-medium mb-4">進階設定</h3>
              <div className="space-y-2">
                <Label htmlFor="stunServer">STUN 伺服器</Label>
                <Input
                  id="stunServer"
                  value={config.stunServer}
                  onChange={(e) => updateConfig("stunServer", e.target.value)}
                  placeholder="stun:stun.l.google.com:19302"
                />
                <p className="text-xs text-muted-foreground">
                  用於 NAT 穿透，預設使用 Google STUN 伺服器
                </p>
              </div>
            </div>

            {/* 操作按鈕 */}
            <div className="flex gap-3 pt-4 border-t border-primary/10">
              <Button
                onClick={handleTestConnection}
                variant="outline"
                disabled={isTesting}
                className="border-primary/30"
              >
                {isTesting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : testStatus === "success" ? (
                  <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                ) : testStatus === "failed" ? (
                  <XCircle className="w-4 h-4 mr-2 text-red-500" />
                ) : (
                  <Phone className="w-4 h-4 mr-2" />
                )}
                {isTesting ? "測試連線中..." : "測試連線"}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-primary hover:shadow-glow"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                {isSaving ? "儲存中..." : "儲存設定"}
              </Button>
            </div>

            {/* 測試結果 */}
            {testStatus === "success" && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-300 text-sm">
                SIP 連線測試成功！已成功註冊到 {config.sipServer}
              </div>
            )}
            {testStatus === "failed" && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                SIP 連線測試失敗，請檢查帳號密碼及伺服器設定是否正確
              </div>
            )}
          </div>
        </Card>

        {/* 架構說明 */}
        <Card className="p-6 mt-6 bg-gradient-card backdrop-blur-sm border-primary/20">
          <h2 className="text-xl font-semibold mb-4">系統架構</h2>
          <div className="text-sm text-muted-foreground space-y-2">
            <p>本系統使用以下架構實現 AI 自動撥號：</p>
            <div className="font-mono text-xs bg-background/50 p-4 rounded-lg overflow-x-auto">
              <pre>{`瀏覽器 (WebRTC/SIP.js)
    ↓ WebSocket
SIP 代理伺服器 (Asterisk/Kamailio)
    ↓ SIP Trunk
中華電信 SIP 閘道器
    ↓ PSTN
對方電話 (市話/手機)`}</pre>
            </div>
            <p className="mt-3">
              <strong>需要的基礎設施：</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>中華電信 SIP trunk 帳號（含市話門號）</li>
              <li>SIP 代理伺服器（需支援 WebSocket，可用 Asterisk + mod_websocket）</li>
              <li>AI 語音引擎（OpenAI TTS/Whisper 或 Google Cloud Speech）</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SipSettings;
