import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Key, Save, Eye, EyeOff } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface APIKey {
  name: string;
  label: string;
  value: string;
  description: string;
}

const KeyManagement = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [apiKeys, setApiKeys] = useState<APIKey[]>([
    {
      name: "OPENAI_API_KEY",
      label: "OpenAI API Key",
      value: "",
      description: "用於 GPT-4 等 OpenAI 模型"
    },
    {
      name: "GOOGLE_API_KEY",
      label: "Google Gemini API Key",
      value: "",
      description: "用於 Google Gemini 模型"
    },
    {
      name: "ANTHROPIC_API_KEY",
      label: "Anthropic Claude API Key",
      value: "",
      description: "用於 Claude 模型"
    },
    {
      name: "XAI_API_KEY",
      label: "xAI Grok API Key",
      value: "",
      description: "用於 Grok 模型（選填）"
    }
  ]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchCurrentKeys();
  }, [navigate]);

  const fetchCurrentKeys = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-api-keys.php`);
      const data = await response.json();
      
      if (data.success && data.keys) {
        setApiKeys(prev => prev.map(key => ({
          ...key,
          value: data.keys[key.name] || ""
        })));
      }
    } catch (error) {
      console.error("獲取金鑰失敗:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const keysToUpdate: Record<string, string> = {};
      apiKeys.forEach(key => {
        keysToUpdate[key.name] = key.value;
      });

      const response = await fetch(`${API_BASE_URL}/update-api-keys.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keys: keysToUpdate })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success("金鑰已更新", {
          description: "API 金鑰已成功儲存至設定檔"
        });
      } else {
        toast.error("更新失敗", {
          description: data.error || "無法更新金鑰"
        });
      }
    } catch (error) {
      console.error("儲存失敗:", error);
      toast.error("儲存失敗", {
        description: "無法連接到伺服器"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateKeyValue = (name: string, value: string) => {
    setApiKeys(prev => prev.map(key => 
      key.name === name ? { ...key, value } : key
    ));
  };

  const toggleShowKey = (name: string) => {
    setShowKeys(prev => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Key className="h-8 w-8" />
              金鑰管理
            </h1>
            <p className="text-muted-foreground mt-1">管理 AI 提供者 API 金鑰</p>
          </div>
        </div>

        <Card className="bg-gradient-card backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle>API 金鑰設定</CardTitle>
            <CardDescription>
              設定各個 AI 提供者的 API 金鑰，留空表示不使用該提供者
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {apiKeys.map((key) => (
              <div key={key.name} className="space-y-2">
                <Label htmlFor={key.name} className="text-base font-medium">
                  {key.label}
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {key.description}
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id={key.name}
                      type={showKeys[key.name] ? "text" : "password"}
                      placeholder={`輸入 ${key.label}`}
                      value={key.value}
                      onChange={(e) => updateKeyValue(key.name, e.target.value)}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleShowKey(key.name)}
                    >
                      {showKeys[key.name] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-6 border-t">
              <Button
                onClick={handleSave}
                disabled={loading}
                className="w-full bg-gradient-primary hover:shadow-glow"
                size="lg"
              >
                <Save className="mr-2 h-5 w-5" />
                {loading ? "儲存中..." : "儲存金鑰"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6 bg-gradient-card backdrop-blur-sm border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">安全提示</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>• API 金鑰將直接儲存在伺服器設定檔中</p>
            <p>• 請妥善保管您的 API 金鑰，不要與他人分享</p>
            <p>• 建議定期更換 API 金鑰以確保安全性</p>
            <p>• 如果金鑰遺失或洩露，請立即前往提供者網站重新生成</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KeyManagement;
