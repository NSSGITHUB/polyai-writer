import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Calendar, Hash, Globe, Wand2, BarChart3, Lightbulb, ImagePlus, Sparkles } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { analyzeSeo, getScoreColor, getScoreLabel, type SeoScore } from "@/lib/seo-analyzer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Article {
  id: number;
  title: string;
  content: string;
  topic?: string;
  keywords?: string;
  language?: string;
  style?: string;
  word_count?: number;
  ai_provider?: string;
  status?: string;
  created_at: string;
  updated_at?: string;
}

const setMeta = (title: string, description: string) => {
  document.title = title;
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.setAttribute("content", description);
  }
};

export default function ArticleView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seoScore, setSeoScore] = useState<SeoScore | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("無效的文章 ID");
      setLoading(false);
      return;
    }

    const fetchArticle = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/get-article.php?id=${id}`);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const result = await response.json();
        if (result.success && result.data) {
          setArticle(result.data);
          setMeta(result.data.title, result.data.topic || "檢視文章詳情");
          
          // 計算 SEO 分數
          const score = analyzeSeo(
            result.data.title,
            result.data.content,
            result.data.keywords
          );
          setSeoScore(score);
        } else {
          throw new Error(result.error || "無法載入文章");
        }
      } catch (err) {
        console.error("載入文章失敗:", err);
        setError(err instanceof Error ? err.message : "載入失敗");
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id]);

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
          articleId: id 
        }
      });

      if (error) {
        throw error;
      }

      if (data?.imageUrl) {
        setGeneratedImage(data.imageUrl);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">載入中...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-destructive">載入失敗</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error || "找不到文章"}</p>
            <Button onClick={() => navigate("/articles")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回文章列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <Button
          onClick={() => navigate("/articles")}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回文章列表
        </Button>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {article.status && (
                <Badge variant={article.status === "published" ? "default" : "secondary"}>
                  {article.status}
                </Badge>
              )}
              {article.ai_provider && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Wand2 className="h-3 w-3" />
                  {article.ai_provider}
                </Badge>
              )}
              {article.language && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  {article.language}
                </Badge>
              )}
              {article.word_count && (
                <Badge variant="outline">
                  {article.word_count} 字
                </Badge>
              )}
            </div>
            <CardTitle className="text-3xl">{article.title}</CardTitle>
            {article.topic && (
              <p className="text-muted-foreground mt-2">{article.topic}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(article.created_at).toLocaleDateString("zh-TW")}
              </div>
              {article.keywords && (
                <div className="flex items-center gap-1">
                  <Hash className="h-4 w-4" />
                  {article.keywords}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <div className="whitespace-pre-wrap leading-relaxed">
                {article.content}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SEO 分析卡片 */}
        {seoScore && (
          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle>SEO 分數分析</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 總分 */}
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(seoScore.overall)}`}>
                  {seoScore.overall}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {getScoreLabel(seoScore.overall)}
                </div>
              </div>

              <Separator />

              {/* 各項指標 */}
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>標題長度</span>
                    <span className={getScoreColor(seoScore.scores.titleLength)}>
                      {seoScore.scores.titleLength}
                    </span>
                  </div>
                  <Progress value={seoScore.scores.titleLength} />
                  <div className="text-xs text-muted-foreground mt-1">
                    當前: {seoScore.details.titleLength} 字符（建議: 50-60）
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>關鍵字密度</span>
                    <span className={getScoreColor(seoScore.scores.keywordDensity)}>
                      {seoScore.scores.keywordDensity}
                    </span>
                  </div>
                  <Progress value={seoScore.scores.keywordDensity} />
                  <div className="text-xs text-muted-foreground mt-1">
                    密度: {seoScore.details.keywordDensity}%（建議: 1-3%）
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>內容長度</span>
                    <span className={getScoreColor(seoScore.scores.contentLength)}>
                      {seoScore.scores.contentLength}
                    </span>
                  </div>
                  <Progress value={seoScore.scores.contentLength} />
                  <div className="text-xs text-muted-foreground mt-1">
                    當前: {seoScore.details.wordCount} 字（建議: 800+ 字）
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>可讀性</span>
                    <span className={getScoreColor(seoScore.scores.readability)}>
                      {seoScore.scores.readability}
                    </span>
                  </div>
                  <Progress value={seoScore.scores.readability} />
                  <div className="text-xs text-muted-foreground mt-1">
                    平均句長: {seoScore.details.averageSentenceLength} 字
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>段落結構</span>
                    <span className={getScoreColor(seoScore.scores.structure)}>
                      {seoScore.scores.structure}
                    </span>
                  </div>
                  <Progress value={seoScore.scores.structure} />
                  <div className="text-xs text-muted-foreground mt-1">
                    段落數: {seoScore.details.paragraphCount}
                  </div>
                </div>
              </div>

              {/* 優化建議 */}
              {seoScore.suggestions.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Lightbulb className="h-4 w-4 text-warning" />
                      <h4 className="font-semibold">優化建議</h4>
                    </div>
                    <ul className="space-y-2">
                      {seoScore.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-warning mt-0.5">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI 圖片生成卡片 */}
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImagePlus className="h-5 w-5 text-primary" />
              <CardTitle>AI 圖片生成</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                圖片描述
              </label>
              <Textarea
                placeholder="描述你想生成的圖片，例如：一個現代化的辦公室場景，明亮的自然光線..."
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                rows={3}
                disabled={generatingImage}
              />
            </div>
            
            <Button 
              onClick={handleGenerateImage}
              disabled={generatingImage || !imagePrompt.trim()}
              className="w-full"
            >
              {generatingImage ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-background mr-2" />
                  生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  生成圖片
                </>
              )}
            </Button>

            {generatedImage && (
              <div className="mt-4 space-y-3">
                <Separator />
                <div className="rounded-lg overflow-hidden border">
                  <img 
                    src={generatedImage} 
                    alt="AI 生成的圖片" 
                    className="w-full h-auto"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedImage;
                      link.download = `article-${id}-image.png`;
                      link.click();
                    }}
                  >
                    下載圖片
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
