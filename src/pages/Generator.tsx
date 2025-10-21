import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

const Generator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string>("");
  const [providers, setProviders] = useState<any[]>([]);

  // 需登入方可使用
  if (!localStorage.getItem("user")) {
    navigate("/auth");
    return null;
  }

  const [formData, setFormData] = useState({
    topic: "",
    keywords: "",
    outline: "",
    language: "zh-TW",
    style: "professional",
    wordCount: "1000",
    selectedModels: {} as Record<string, boolean>,
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-ai-providers.php`);
      const data = await response.json();
      
      if (data.success) {
        const enabledProviders = data.providers.filter((p: any) => p.is_enabled === 1);
        setProviders(enabledProviders);
        
        // 初始化 selectedModels，第一個為預設選中
        const initialSelection: Record<string, boolean> = {};
        enabledProviders.forEach((p: any, index: number) => {
          initialSelection[p.provider_name] = index === 0;
        });
        setFormData(prev => ({ ...prev, selectedModels: initialSelection }));
      }
    } catch (error) {
      console.error("獲取提供者失敗:", error);
      toast({
        title: "載入失敗",
        description: "無法載入 AI 提供者列表",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = async () => {
    if (!formData.topic) {
      toast({
        title: "請輸入文章主題",
        description: "主題關鍵字為必填項目",
        variant: "destructive",
      });
      return;
    }

    const selectedCount = Object.values(formData.selectedModels).filter(Boolean).length;
    if (selectedCount === 0) {
      toast({
        title: "請選擇至少一個AI模型",
        description: "需要選擇至少一個AI模型來生成文章",
        variant: "destructive",
      });
      return;
    }

    setGenerating(true);
    setResult("");

    const selectedProviders = Object.entries(formData.selectedModels)
      .filter(([_, checked]) => checked)
      .map(([provider]) => provider);

    const results: string[] = [];

    try {
      for (const provider of selectedProviders) {
        const response = await fetch(`${API_BASE_URL}/generate-article.php`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            topic: formData.topic,
            keywords: formData.keywords,
            outline: formData.outline,
            language: formData.language,
            style: formData.style,
            wordCount: Number(formData.wordCount),
            provider,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message = errorData.error || `${provider} 產生失敗`;
          toast({
            title: "產生失敗",
            description: message,
            variant: "destructive",
          });
          continue;
        }

        const data = await response.json();
        const generatedText = data?.generatedText as string;
        if (generatedText) {
          results.push(`=== ${provider.toUpperCase()} 產生結果 ===\n\n${generatedText}\n\n`);
        }
      }

      if (results.length > 0) {
        const fullContent = results.join("\n" + "=".repeat(50) + "\n\n");
        setResult(fullContent);
        
        // 自動儲存到資料庫
        try {
          const user = JSON.parse(localStorage.getItem("user") || "{}");
          const userId = user.id;
          
          if (!userId) {
            toast({
              title: "儲存失敗",
              description: "請先登入才能儲存文章",
              variant: "destructive",
            });
            return;
          }
          
          // 準備儲存資料（同時提供 userId 與 user_id 以相容不同版本後端）
          const payload = {
            userId: userId,
            user_id: userId,
            title: (formData.topic || "").trim() || "未命名文章",
            content: fullContent,
            topic: formData.topic,
            keywords: formData.keywords,
            outline: formData.outline,
            language: formData.language,
            style: formData.style,
            wordCount: Number(formData.wordCount),
            aiProvider: selectedProviders.join(", "),
            status: "published",
          };

          // 為了除錯：不要印出全文，只記錄長度與必要欄位
          console.debug("[save-article] sending", {
            titleLen: payload.title.length,
            contentLen: payload.content.length,
            userId: payload.userId,
          });

          const saveResponse = await fetch(`${API_BASE_URL}/save-article.php`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "X-Debug": "1",
            },
            body: JSON.stringify(payload),
          });

          if (saveResponse.ok) {
            toast({
              title: "文章生成並儲存成功！",
              description: `已使用 ${results.length} 個AI模型生成並儲存文章`,
            });
          } else {
            const raw = await saveResponse.text();
            let errMsg = raw;
            let details = '';
            try {
              const parsed = JSON.parse(raw);
              errMsg = parsed?.error || raw;
              if (parsed?.details) {
                details = ` | details: ${JSON.stringify(parsed.details)}`;
              }
            } catch {}

            console.error("[save-article] failed", saveResponse.status, errMsg, details);
            toast({
              title: "文章生成成功但儲存失敗",
              description: `HTTP ${saveResponse.status} - ${String(errMsg).slice(0, 300)}${details ? ' ' + String(details).slice(0, 400) : ''}`,
              variant: "destructive",
            });
          }
        } catch (saveError) {
          console.error("Save error:", saveError);
          toast({
            title: "文章生成成功",
            description: `已使用 ${results.length} 個AI模型生成文章（儲存失敗）`,
          });
        }
      } else {
        toast({
          title: "產生失敗",
          description: "所有模型都無法產生內容",
          variant: "destructive",
        });
      }
    } catch (e) {
      console.error(e);
      toast({
        title: "產生失敗",
        description: e instanceof Error ? e.message : "未知錯誤",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            className="mr-4"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">AI文章生成器</h1>
            <p className="text-muted-foreground">使用多個AI模型一次生成高質量SEO文章</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <Card className="lg:col-span-2 p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <div className="space-y-6">
              {/* Topic */}
              <div className="space-y-2">
                <Label htmlFor="topic">文章主題 *</Label>
                <Input
                  id="topic"
                  placeholder="例如：人工智慧在醫療領域的應用"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                />
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                <Label htmlFor="keywords">關鍵字</Label>
                <Input
                  id="keywords"
                  placeholder="用逗號分隔，例如：AI, 醫療, 診斷"
                  value={formData.keywords}
                  onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                />
              </div>

              {/* Outline */}
              <div className="space-y-2">
                <Label htmlFor="outline">文章大綱（選填）</Label>
                <Textarea
                  id="outline"
                  placeholder="輸入文章大綱或讓AI自動生成"
                  className="min-h-[120px]"
                  value={formData.outline}
                  onChange={(e) => setFormData({ ...formData, outline: e.target.value })}
                />
              </div>

              {/* Settings Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">語言</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(value) => setFormData({ ...formData, language: value })}
                  >
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="zh-TW">繁體中文</SelectItem>
                      <SelectItem value="zh-CN">简体中文</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="style">寫作風格</Label>
                  <Select
                    value={formData.style}
                    onValueChange={(value) => setFormData({ ...formData, style: value })}
                  >
                    <SelectTrigger id="style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">專業正式</SelectItem>
                      <SelectItem value="casual">輕鬆口語</SelectItem>
                      <SelectItem value="technical">技術專業</SelectItem>
                      <SelectItem value="creative">創意生動</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wordCount">字數</Label>
                  <Select
                    value={formData.wordCount}
                    onValueChange={(value) => setFormData({ ...formData, wordCount: value })}
                  >
                    <SelectTrigger id="wordCount">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="500">500字</SelectItem>
                      <SelectItem value="1000">1000字</SelectItem>
                      <SelectItem value="1500">1500字</SelectItem>
                      <SelectItem value="2000">2000字</SelectItem>
                      <SelectItem value="3000">3000字</SelectItem>
                      <SelectItem value="4000">4000字</SelectItem>
                      <SelectItem value="5000">5000字</SelectItem>
                      <SelectItem value="8000">8000字</SelectItem>
                      <SelectItem value="10000">10000字</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* AI Model Selection */}
          <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <h3 className="text-xl font-semibold mb-4">選擇AI模型</h3>
            <p className="text-sm text-muted-foreground mb-6">
              選擇一個或多個AI模型來生成文章
            </p>

            <div className="space-y-4">
              {providers.map((provider) => (
                <div 
                  key={provider.provider_name}
                  className="flex items-center space-x-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors"
                >
                  <Checkbox
                    id={provider.provider_name}
                    checked={formData.selectedModels[provider.provider_name] || false}
                    onCheckedChange={(checked) =>
                      setFormData({
                        ...formData,
                        selectedModels: { 
                          ...formData.selectedModels, 
                          [provider.provider_name]: !!checked 
                        },
                      })
                    }
                  />
                  <Label htmlFor={provider.provider_name} className="flex-1 cursor-pointer">
                    <div className="font-medium">{provider.provider_label}</div>
                    <div className="text-xs text-muted-foreground">
                      {provider.description}
                      {provider.has_api_key === 0 && (
                        <span className="text-destructive ml-1">（未設定金鑰）</span>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </div>

            <Button
              className="w-full mt-6 bg-gradient-primary hover:shadow-glow"
              size="lg"
              onClick={handleGenerate}
              disabled={generating}
            >
              <Sparkles className="mr-2 w-5 h-5" />
              {generating ? "生成中..." : "開始生成文章"}
            </Button>
          </Card>
        </div>

        {result && (
          <Card className="mt-6 p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
            <h3 className="text-xl font-semibold mb-4">生成結果</h3>
            <Textarea readOnly value={result} className="min-h-[300px]" />
          </Card>
        )}
      </div>
    </div>
  );
};

export default Generator;
