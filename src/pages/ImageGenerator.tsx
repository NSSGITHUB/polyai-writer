import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ImagePlus, Sparkles, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ImageGenerator() {
  const navigate = useNavigate();
  const [imagePrompt, setImagePrompt] = useState("");
  const [articleId, setArticleId] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) {
      toast.error("請輸入圖片描述");
      return;
    }

    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { 
          prompt: imagePrompt,
          articleId: articleId || undefined
        }
      });

      if (error) {
        throw error;
      }

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
        
        // 保存圖片到數據庫
        const userId = localStorage.getItem('userId');
        if (userId) {
          try {
            await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8888'}/api/save-image.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: userId,
                article_id: articleId || null,
                prompt: imagePrompt,
                image_url: data.imageUrl,
                image_data: data.imageUrl.startsWith('data:') ? data.imageUrl : null
              })
            });
          } catch (saveError) {
            console.error("保存圖片記錄失敗:", saveError);
          }
        }
        
        toast.success("圖片生成成功！");
      } else {
        throw new Error("未能獲取圖片");
      }
    } catch (err) {
      console.error("生成圖片失敗:", err);
      toast.error(err instanceof Error ? err.message : "生成圖片失敗");
    } finally {
      setGeneratingImage(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-image-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          onClick={() => navigate("/dashboard")}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回儀表板
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImagePlus className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-2xl">AI 配圖生成</CardTitle>
                <CardDescription className="mt-1">
                  使用 AI 為你的文章生成精美配圖
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="article-id">文章 ID（選填）</Label>
                <Input
                  id="article-id"
                  type="number"
                  placeholder="輸入要關聯的文章 ID"
                  value={articleId}
                  onChange={(e) => setArticleId(e.target.value)}
                  disabled={generatingImage}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  關聯文章 ID 可以幫助系統更好地理解圖片用途
                </p>
              </div>

              <div>
                <Label htmlFor="image-prompt">圖片描述 *</Label>
                <Textarea
                  id="image-prompt"
                  placeholder="詳細描述你想生成的圖片，例如：&#10;&#10;一個現代化的辦公室場景，明亮的自然光線透過大窗戶照射進來，桌面上放置著筆記本電腦和咖啡杯，背景是城市天際線，專業且溫馨的氛圍..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={6}
                  disabled={generatingImage}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  提示：描述越詳細，生成的圖片越符合預期
                </p>
              </div>
            </div>

            <Button 
              onClick={handleGenerateImage}
              disabled={generatingImage || !imagePrompt.trim()}
              className="w-full"
              size="lg"
            >
              {generatingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2" />
                  AI 正在生成圖片...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  生成圖片
                </>
              )}
            </Button>

            {generatedImage && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">生成結果</h3>
                  <div className="rounded-lg overflow-hidden border bg-muted">
                    <img 
                      src={generatedImage} 
                      alt="AI 生成的圖片" 
                      className="w-full h-auto"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleDownload}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      下載圖片
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setGeneratedImage(null);
                        setImagePrompt("");
                        setArticleId("");
                      }}
                      className="flex-1"
                    >
                      重新生成
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
