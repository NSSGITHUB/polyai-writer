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
import { supabase } from "@/integrations/supabase/client";

const Generator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<Array<{provider: string, content: string, articleId?: number, imageUrl?: string}>>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState(5);
  const [autoGenerateImage, setAutoGenerateImage] = useState(true);
  const [scheduleSettings, setScheduleSettings] = useState({
    enabled: false,
    startDate: "",
    publishTime: "09:00",
    selectedSiteId: "",
  });
  const [directPublishSettings, setDirectPublishSettings] = useState({
    enabled: false,
    selectedSiteIds: [] as string[],
  });
  const [wordPressSites, setWordPressSites] = useState<Array<{id: string, name: string}>>([]);

  // 需登入方可使用
  if (!localStorage.getItem("user")) {
    navigate("/auth");
    return null;
  }

  const [formData, setFormData] = useState({
    topic: "",
    keywords: "",
    outline: "",
    targetAudience: "",
    searchIntent: "",
    contentRequirements: "",
    language: "zh-TW",
    style: "professional",
    wordCount: "1000",
    selectedModels: {
      openai: true,
      google: false,
      anthropic: false,
      xai: false,
    },
  });

  useEffect(() => {
    fetchWordPressSites();
  }, []);

  const fetchWordPressSites = async () => {
    try {
      const { data, error } = await supabase
        .from('wordpress_sites')
        .select('id, name')
        .eq('is_active', true);
      
      if (error) throw error;
      setWordPressSites(data || []);
    } catch (error) {
      console.error('Error fetching WordPress sites:', error);
    }
  };


  const handleGenerate = async () => {
    if (!formData.topic) {
      toast({
        title: "請輸入文章主題",
        description: "主題為必填項目",
        variant: "destructive",
      });
      return;
    }

    const articlesToGenerate = batchMode ? batchCount : 1;

    if (scheduleSettings.enabled && !scheduleSettings.selectedSiteId) {
      toast({
        title: "請選擇WordPress站點",
        description: "排程發布需要選擇目標站點",
        variant: "destructive",
      });
      return;
    }

    if (scheduleSettings.enabled && !scheduleSettings.startDate) {
      toast({
        title: "請選擇開始日期",
        description: "排程發布需要設定開始日期",
        variant: "destructive",
      });
      return;
    }

    if (directPublishSettings.enabled && directPublishSettings.selectedSiteIds.length === 0) {
      toast({
        title: "請選擇WordPress站點",
        description: "立即發布需要選擇至少一個目標站點",
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
    setResults([]);

    const selectedProviders: Array<"openai" | "google" | "anthropic" | "xai"> = [];
    if (formData.selectedModels.openai) selectedProviders.push("openai");
    if (formData.selectedModels.google) selectedProviders.push("google");
    if (formData.selectedModels.anthropic) selectedProviders.push("anthropic");
    if (formData.selectedModels.xai) selectedProviders.push("xai");

    const generatedArticles: Array<{provider: string, content: string, articleId?: number, imageUrl?: string}> = [];

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const userId = user.id;
      
      if (!userId) {
        toast({
          title: "請先登入",
          description: "需要登入才能生成和儲存文章",
          variant: "destructive",
        });
        setGenerating(false);
        return;
      }

      let articleIndex = 0;
      for (let i = 0; i < articlesToGenerate; i++) {
        for (const provider of selectedProviders) {
          try {
            // 生成文章
            const articleNumber = batchMode ? ` 第${i + 1}篇` : '';
            const { data, error } = await supabase.functions.invoke('generate-article', {
              body: {
                topic: formData.topic,
                keywords: formData.keywords,
                outline: formData.outline,
                targetAudience: formData.targetAudience,
                searchIntent: formData.searchIntent,
                contentRequirements: formData.contentRequirements,
                language: formData.language,
                style: formData.style,
                wordCount: Number(formData.wordCount),
                provider,
              }
            });

            if (error) {
              console.error(`${provider} 生成錯誤:`, error);
              toast({
                title: `${provider.toUpperCase()} 產生失敗`,
                description: error.message || 'AI 服務錯誤',
                variant: 'destructive',
                duration: 8000,
              });
              continue;
            }

            const generatedText = (data?.generatedText as string) || '';
            const sanitize = (text: string) =>
              text
                .replace(/^\s*(好的，?這是一篇|好的，這是|以下是|根據您的要求|如您所需|符合您要求|我將為您|我會為您).*/im, '')
                .replace(/^.*(字數|200\s*[–-]\s*300\s*字|3000\s*字|±10%).*$/gim, '')
                .replace(/^.*(回應內容|回覆內容|生成內容|以下內容).*$/gim, '')
                .replace(/\n{3,}/g, '\n\n')
                .trim();
            const cleanedText = sanitize(generatedText);
            if (!cleanedText) continue;

            // 儲存每篇文章
            const savePayload = {
              userId: userId,
              user_id: userId,
              title: `${formData.topic}${articleNumber} (${provider.toUpperCase()})`,
              content: generatedText,
              topic: formData.topic,
              keywords: formData.keywords,
              outline: formData.outline,
              language: formData.language,
              style: formData.style,
              wordCount: Number(formData.wordCount),
              aiProvider: provider,
              status: "published",
            };

            const saveResponse = await fetch(`${API_BASE_URL}/save-article.php`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
              },
              body: JSON.stringify(savePayload),
            });

            let articleId: number | undefined;
            let savedImageUrl: string | undefined;
            if (saveResponse.ok) {
              const saveData = await saveResponse.json();
              articleId = saveData.id;

              // 自動生成圖片
              if (autoGenerateImage && articleId) {
                try {
                  console.log(`開始為文章 ${articleId} 生成圖片...`);
                  const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-image', {
                    body: { 
                      prompt: `為文章「${formData.topic}」生成一張專業、高質量的配圖，風格現代簡潔`, 
                      articleId 
                    }
                  });

                  if (imageError) {
                    console.error('圖片生成失敗:', imageError);
                    toast({
                      title: "圖片生成失敗",
                      description: imageError.message || "無法生成圖片",
                      variant: "destructive",
                    });
                  } else if (imageData?.imageUrl) {
                    console.log('圖片生成成功，正在保存...');
                    // 保存圖片到資料庫
                    const saveImageResponse = await fetch(`${API_BASE_URL}/save-image.php`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        user_id: userId,
                        article_id: articleId,
                        prompt: `為文章「${formData.topic}」生成的配圖`,
                        image_url: imageData.imageUrl,
                        image_data: imageData.imageUrl,
                        width: 1024,
                        height: 1024,
                      }),
                    });
                    
                      if (saveImageResponse.ok) {
                        const saved = await saveImageResponse.json().catch(() => null);
                        savedImageUrl = saved?.image_url || imageData.imageUrl;
                        console.log('圖片已成功保存:', savedImageUrl);
                        toast({
                          title: "圖片已生成",
                          description: "文章配圖已自動生成並保存",
                        });
                    } else {
                      console.error('保存圖片失敗');
                      // 即使保存失敗，也先在前端顯示生成的圖片
                      savedImageUrl = imageData.imageUrl;
                    }
                  } else {
                    console.warn('未收到圖片URL');
                  }
                } catch (imgError) {
                  console.error('圖片處理錯誤:', imgError);
                  toast({
                    title: "圖片處理錯誤",
                    description: imgError instanceof Error ? imgError.message : "未知錯誤",
                    variant: "destructive",
                  });
                }
              }

              // 如果啟用排程，創建排程發布
              if (scheduleSettings.enabled && scheduleSettings.selectedSiteId) {
                const [hours, minutes] = scheduleSettings.publishTime.split(':').map(Number);
                const startDate = new Date(scheduleSettings.startDate);
                startDate.setHours(hours, minutes, 0, 0);
                const scheduledDate = new Date(startDate);
                scheduledDate.setDate(scheduledDate.getDate() + articleIndex);

                try {
                  const { error: scheduleError } = await supabase.functions.invoke('send-to-wordpress', {
                    body: {
                      articleId,
                      siteIds: [scheduleSettings.selectedSiteId],
                      scheduledTime: scheduledDate.toISOString(),
                    }
                  });

                  if (scheduleError) {
                    console.error('排程失敗:', scheduleError);
                  }
                } catch (schedError) {
                  console.error('排程錯誤:', schedError);
                }
              }

              // 如果啟用立即發布，直接發布到WordPress
              if (directPublishSettings.enabled && directPublishSettings.selectedSiteIds.length > 0 && articleId) {
                try {
                  const { data: publishData, error: publishError } = await supabase.functions.invoke('send-to-wordpress', {
                    body: {
                      articleId,
                      siteIds: directPublishSettings.selectedSiteIds,
                      status: 'publish',
                    }
                  });

                  if (publishError) {
                    console.error('立即發布失敗:', publishError);
                    toast({
                      title: "WordPress發布失敗",
                      description: publishError.message,
                      variant: "destructive",
                    });
                  } else if (publishData?.success) {
                    const successCount = publishData.results?.filter((r: any) => r.success).length || 0;
                    console.log(`成功發布至 ${successCount} 個WordPress站點`);
                  }
                } catch (publishErr) {
                  console.error('立即發布錯誤:', publishErr);
                }
              }
            }

            generatedArticles.push({
              provider: provider.toUpperCase(),
              content: generatedText,
              articleId,
              imageUrl: savedImageUrl
            });
            
            articleIndex++;

          } catch (providerError) {
            console.error(`${provider} error:`, providerError);
            toast({
              title: `${provider.toUpperCase()} 產生失敗`,
              description: providerError instanceof Error ? providerError.message : "未知錯誤",
              variant: "destructive",
            });
          }
        }
      }

      if (generatedArticles.length > 0) {
        setResults(generatedArticles);
        const scheduleMsg = scheduleSettings.enabled 
          ? `，並已排程發布至WordPress` 
          : directPublishSettings.enabled 
            ? `，並已發布至 ${directPublishSettings.selectedSiteIds.length} 個WordPress站點` 
            : '';
        toast({
          title: "文章生成成功！",
          description: `已生成並儲存 ${generatedArticles.length} 篇文章${scheduleMsg}`,
        });
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

              {/* 批量模式設定 */}
              <div className="space-y-3 p-4 rounded-lg bg-background/50">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="batchMode"
                    checked={batchMode}
                    onCheckedChange={(checked) => setBatchMode(!!checked)}
                  />
                  <Label htmlFor="batchMode" className="cursor-pointer">
                    批量生成模式（生成多篇同主題文章）
                  </Label>
                </div>
                
                {batchMode && (
                  <div className="space-y-2 pl-7">
                    <Label htmlFor="batchCount">生成數量（最多30篇）</Label>
                    <Input
                      id="batchCount"
                      type="number"
                      min="1"
                      max="30"
                      value={batchCount}
                      onChange={(e) => setBatchCount(Math.min(30, Math.max(1, Number(e.target.value))))}
                    />
                    <p className="text-xs text-muted-foreground">
                      將生成 {batchCount} 篇相同主題的文章
                    </p>
                  </div>
                )}
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

              {/* 結構化內容提示 */}
              <div className="space-y-4 p-4 rounded-lg border border-primary/20 bg-background/30">
                <h3 className="font-semibold text-lg">文章內容規格（選填）</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="targetAudience">目標受眾</Label>
                  <Input
                    id="targetAudience"
                    placeholder="例如：中小企業主、網站管理員、IT決策者"
                    value={formData.targetAudience}
                    onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="searchIntent">搜尋意圖</Label>
                  <Textarea
                    id="searchIntent"
                    placeholder="例如：使用者想要比較不同企業主機方案的規格、價格與服務，並做出最佳選擇"
                    className="min-h-[80px]"
                    value={formData.searchIntent}
                    onChange={(e) => setFormData({ ...formData, searchIntent: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentRequirements">內容要求</Label>
                  <Textarea
                    id="contentRequirements"
                    placeholder="例如：&#10;1. 比較表格：製作清晰的表格，比較不同主機方案的CPU、RAM、儲存空間、流量限制、價格&#10;2. 數據佐證：加入市場調查數據、效能測試結果、客戶滿意度統計"
                    className="min-h-[120px]"
                    value={formData.contentRequirements}
                    onChange={(e) => setFormData({ ...formData, contentRequirements: e.target.value })}
                  />
                </div>
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

              {/* 自動生成圖片選項 */}
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50">
                <Checkbox
                  id="autoImage"
                  checked={autoGenerateImage}
                  onCheckedChange={(checked) => setAutoGenerateImage(!!checked)}
                />
                <Label htmlFor="autoImage" className="cursor-pointer">
                  自動為每篇文章生成配圖
                </Label>
              </div>

              {/* WordPress發布設定 */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50">
                    <Checkbox
                      id="directPublishEnabled"
                      checked={directPublishSettings.enabled}
                      onCheckedChange={(checked) => {
                        setDirectPublishSettings({ ...directPublishSettings, enabled: !!checked });
                        if (checked) {
                          setScheduleSettings({ ...scheduleSettings, enabled: false });
                        }
                      }}
                    />
                    <Label htmlFor="directPublishEnabled" className="cursor-pointer">
                      生成後立即發布至WordPress
                    </Label>
                  </div>

                  {directPublishSettings.enabled && (
                    <div className="space-y-3 pl-4">
                      <Label>選擇目標站點</Label>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto border rounded-lg p-3">
                        {wordPressSites.length === 0 ? (
                          <p className="text-sm text-muted-foreground">尚無可用的WordPress站點</p>
                        ) : (
                          wordPressSites.map(site => (
                            <div key={site.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`direct-site-${site.id}`}
                                checked={directPublishSettings.selectedSiteIds.includes(site.id)}
                                onCheckedChange={(checked) => {
                                  setDirectPublishSettings(prev => ({
                                    ...prev,
                                    selectedSiteIds: checked 
                                      ? [...prev.selectedSiteIds, site.id]
                                      : prev.selectedSiteIds.filter(id => id !== site.id)
                                  }));
                                }}
                              />
                              <Label htmlFor={`direct-site-${site.id}`} className="cursor-pointer text-sm">
                                {site.name}
                              </Label>
                            </div>
                          ))
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        文章生成後將立即發布至所選站點
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50">
                  <Checkbox
                    id="scheduleEnabled"
                    checked={scheduleSettings.enabled}
                    onCheckedChange={(checked) => {
                      setScheduleSettings({ ...scheduleSettings, enabled: !!checked });
                      if (checked) {
                        setDirectPublishSettings({ ...directPublishSettings, enabled: false });
                      }
                    }}
                  />
                  <Label htmlFor="scheduleEnabled" className="cursor-pointer">
                    啟用每日自動排程發布至WordPress
                  </Label>
                </div>

                {scheduleSettings.enabled && (
                  <div className="space-y-4 pl-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">開始日期</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={scheduleSettings.startDate}
                          min={new Date().toISOString().split('T')[0]}
                          onChange={(e) => 
                            setScheduleSettings({ ...scheduleSettings, startDate: e.target.value })
                          }
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="publishTime">發布時間</Label>
                        <Input
                          id="publishTime"
                          type="time"
                          value={scheduleSettings.publishTime}
                          onChange={(e) => 
                            setScheduleSettings({ ...scheduleSettings, publishTime: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      每篇文章將依序在每天 {scheduleSettings.publishTime} 發布，最長30天
                    </p>

                    <div className="space-y-2">
                      <Label htmlFor="wpSite">目標WordPress站點</Label>
                      <Select
                        value={scheduleSettings.selectedSiteId}
                        onValueChange={(value) => 
                          setScheduleSettings({ ...scheduleSettings, selectedSiteId: value })
                        }
                      >
                        <SelectTrigger id="wpSite">
                          <SelectValue placeholder="選擇站點" />
                        </SelectTrigger>
                        <SelectContent>
                          {wordPressSites.map((site) => (
                            <SelectItem key={site.id} value={site.id}>
                              {site.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
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
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                <Checkbox
                  id="openai"
                  checked={formData.selectedModels.openai}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      selectedModels: { ...formData.selectedModels, openai: !!checked },
                    })
                  }
                />
                <Label htmlFor="openai" className="flex-1 cursor-pointer">
                  <div className="font-medium">OpenAI GPT</div>
                  <div className="text-xs text-muted-foreground">最受歡迎的AI模型</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                <Checkbox
                  id="google"
                  checked={formData.selectedModels.google}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      selectedModels: { ...formData.selectedModels, google: !!checked },
                    })
                  }
                />
                <Label htmlFor="google" className="flex-1 cursor-pointer">
                  <div className="font-medium">Google Gemini</div>
                  <div className="text-xs text-muted-foreground">強大的多模態模型</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                <Checkbox
                  id="anthropic"
                  checked={formData.selectedModels.anthropic}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      selectedModels: { ...formData.selectedModels, anthropic: !!checked },
                    })
                  }
                />
                <Label htmlFor="anthropic" className="flex-1 cursor-pointer">
                  <div className="font-medium">Anthropic Claude</div>
                  <div className="text-xs text-muted-foreground">擅長長文本理解</div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-colors">
                <Checkbox
                  id="xai"
                  checked={formData.selectedModels.xai}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      selectedModels: { ...formData.selectedModels, xai: !!checked },
                    })
                  }
                />
                <Label htmlFor="xai" className="flex-1 cursor-pointer">
                  <div className="font-medium">xAI Grok / Manus</div>
                  <div className="text-xs text-muted-foreground">最新AI技術</div>
                </Label>
              </div>
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

        {results.length > 0 && (
          <div className="mt-6 space-y-4">
            {results.map((article, index) => (
              <Card key={index} className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">{article.provider} 生成結果</h3>
                  {article.articleId && (
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/articles/${article.articleId}`)}
                    >
                      查看詳情
                    </Button>
                  )}
                </div>
                {article.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={article.imageUrl}
                      alt={`${article.provider} 生成配圖`}
                      className="w-full max-h-64 object-cover rounded border"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
                <Textarea readOnly value={article.content} className="min-h-[300px]" />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Generator;
