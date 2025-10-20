import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, BarChart3, Lightbulb, Sparkles } from "lucide-react";
import { analyzeSeo, getScoreColor, getScoreLabel, type SeoScore } from "@/lib/seo-analyzer";

const setMeta = (title: string, description: string) => {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", description);
};

export default function SeoAnalyzer() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [keywords, setKeywords] = useState("");
  const [seoScore, setSeoScore] = useState<SeoScore | null>(null);

  useState(() => {
    setMeta(
      "SEO 分析工具 | AI 內容產生器",
      "快速分析文章的 SEO 表現，獲得專業優化建議"
    );
  });

  const handleAnalyze = () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    const score = analyzeSeo(title, content, keywords);
    setSeoScore(score);
  };

  const handleClear = () => {
    setTitle("");
    setContent("");
    setKeywords("");
    setSeoScore(null);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <Button
          onClick={() => navigate("/dashboard")}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回控制台
        </Button>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* 輸入區域 */}
          <Card className="bg-gradient-card backdrop-blur-sm border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>文章內容輸入</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">文章標題 *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="輸入文章標題"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="keywords">關鍵字（選填）</Label>
                <Input
                  id="keywords"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="關鍵字1, 關鍵字2, 關鍵字3"
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  多個關鍵字請用逗號分隔
                </p>
              </div>

              <div>
                <Label htmlFor="content">文章內容 *</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="貼上或輸入文章內容..."
                  className="mt-1.5 min-h-[300px] resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  當前字數: {content.length}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={!title.trim() || !content.trim()}
                  className="flex-1 bg-gradient-primary hover:shadow-glow"
                >
                  <BarChart3 className="mr-2 h-4 w-4" />
                  開始分析
                </Button>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="border-primary/30"
                >
                  清除
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 分析結果區域 */}
          <Card className="bg-gradient-card backdrop-blur-sm border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <CardTitle>SEO 分析結果</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {!seoScore ? (
                <div className="flex items-center justify-center h-[500px] text-center">
                  <div>
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      請輸入標題和內容後點擊「開始分析」
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
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
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
