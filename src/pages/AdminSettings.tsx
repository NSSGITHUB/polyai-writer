import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Shield, Key, ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface AIProvider {
  id: number;
  provider_name: string;
  provider_label: string;
  masked_api_key: string | null;
  has_api_key: number;
  is_enabled: number;
  api_endpoint: string;
  model_name: string;
  description: string;
}

const AdminSettings = () => {
  const navigate = useNavigate();
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingKeys, setEditingKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAdminAccess();
    fetchProviders();
  }, []);

  const checkAdminAccess = async () => {
    const userId = localStorage.getItem("userId");
    if (!userId) {
      toast.error("請先登入");
      navigate("/auth");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/check-user-role.php?user_id=${userId}`);
      const data = await response.json();
      
      if (data.success && data.is_admin) {
        setIsAdmin(true);
      } else {
        toast.error("您沒有管理員權限");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("檢查權限失敗:", error);
      toast.error("無法驗證管理員權限");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-ai-providers.php`);
      const data = await response.json();
      
      if (data.success) {
        setProviders(data.providers);
      }
    } catch (error) {
      console.error("獲取提供者失敗:", error);
      toast.error("無法載入 AI 提供者設定");
    }
  };

  const updateProvider = async (providerName: string, updates: any) => {
    try {
      const response = await fetch(`${API_BASE_URL}/update-ai-provider.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_name: providerName,
          ...updates
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("設定已更新");
        fetchProviders();
        // 清除編輯中的金鑰
        setEditingKeys(prev => {
          const newKeys = { ...prev };
          delete newKeys[providerName];
          return newKeys;
        });
      } else {
        toast.error(data.error || "更新失敗");
      }
    } catch (error) {
      console.error("更新失敗:", error);
      toast.error("更新提供者設定失敗");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">驗證權限中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              管理員設定
            </h1>
            <p className="text-muted-foreground mt-1">管理 AI 提供者 API 金鑰</p>
          </div>
        </div>

        <div className="space-y-4">
          {providers.map((provider) => (
            <Card key={provider.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{provider.provider_label}</span>
                  <Switch
                    checked={provider.is_enabled === 1}
                    onCheckedChange={(checked) => 
                      updateProvider(provider.provider_name, { is_enabled: checked })
                    }
                  />
                </CardTitle>
                <CardDescription>{provider.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor={`key-${provider.provider_name}`}>
                    API 金鑰
                    {provider.has_api_key === 1 && (
                      <span className="ml-2 text-xs text-green-600">✓ 已設定</span>
                    )}
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id={`key-${provider.provider_name}`}
                      type="password"
                      placeholder={
                        provider.has_api_key === 1 
                          ? provider.masked_api_key || "••••••••" 
                          : "輸入 API 金鑰"
                      }
                      value={editingKeys[provider.provider_name] || ""}
                      onChange={(e) => 
                        setEditingKeys(prev => ({
                          ...prev,
                          [provider.provider_name]: e.target.value
                        }))
                      }
                    />
                    <Button
                      onClick={() => 
                        updateProvider(provider.provider_name, { 
                          api_key: editingKeys[provider.provider_name] 
                        })
                      }
                      disabled={!editingKeys[provider.provider_name]}
                    >
                      <Key className="mr-2 h-4 w-4" />
                      更新
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">API 端點</Label>
                    <p className="font-mono text-xs mt-1 break-all">{provider.api_endpoint || "未設定"}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">模型名稱</Label>
                    <p className="font-mono text-xs mt-1">{provider.model_name || "未設定"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
