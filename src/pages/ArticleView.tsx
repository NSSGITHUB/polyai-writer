import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Hash, Globe, Wand2, BarChart3, Lightbulb, FileDown } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { analyzeSeo, getScoreColor, getScoreLabel, type SeoScore } from "@/lib/seo-analyzer";
import { Document, Paragraph, TextRun, HeadingLevel, Packer } from "docx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

import { SendToWordPressDialog } from "@/components/SendToWordPressDialog";

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

interface ArticleImage {
  id: string;
  article_id: number;
  prompt: string;
  image_url: string;
  width: number;
  height: number;
  created_at: string;
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
  const [images, setImages] = useState<ArticleImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seoScore, setSeoScore] = useState<SeoScore | null>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadAsWord = async () => {
    if (!article) return;
    
    setDownloading(true);
    try {
      const paragraphs = article.content.split('\n').filter(p => p.trim()).map(text => 
        new Paragraph({
          children: [new TextRun(text)],
          spacing: { after: 200 }
        })
      );

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: article.title,
              heading: HeadingLevel.HEADING_1,
              spacing: { after: 400 }
            }),
            ...paragraphs
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `${article.title}.docx`);
    } catch (err) {
      console.error("Word 下載失敗:", err);
    } finally {
      setDownloading(false);
    }
  };

  const downloadAsPDF = async () => {
    if (!article) return;

    setDownloading(true);
    try {
      // Helper: URL -> data URL
      const toDataUrl = async (url: string): Promise<{ dataUrl: string; format: 'PNG' | 'JPEG' }> => {
        const resolveUrl = (u: string) => (u.startsWith('http') || u.startsWith('data:') ? u : `https://autowriter.ai.com.tw${u}`);
        const finalUrl = resolveUrl(url);
        if (finalUrl.startsWith('data:')) {
          const mime = finalUrl.substring(5, finalUrl.indexOf(';'));
          const format = mime.includes('jpeg') || mime.includes('jpg') ? 'JPEG' : 'PNG';
          return { dataUrl: finalUrl, format };
        }
        const res = await fetch(finalUrl);
        const blob = await res.blob();
        const format = blob.type.includes('jpeg') || blob.type.includes('jpg') ? 'JPEG' : 'PNG';
        const reader = new FileReader();
        const p = new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        const dataUrl = await p;
        return { dataUrl, format };
      };

      // Load and register CJK font to avoid garbled text
      const fontResp = await fetch('/fonts/NotoSansTC-Regular.ttf');
      if (!fontResp.ok) throw new Error('NotoSansTC 字型載入失敗');
      const fontBuf = await fontResp.arrayBuffer();
      const base64FromArrayBuffer = (buf: ArrayBuffer) => {
        let binary = '';
        const bytes = new Uint8Array(buf);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
        return btoa(binary);
      };

      const fontBase64 = base64FromArrayBuffer(fontBuf);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      // Register font into jsPDF VFS and use it
      // File name here must match the one used in addFont below
      (pdf as any).addFileToVFS('NotoSansTC-Regular.ttf', fontBase64);
      (pdf as any).addFont('NotoSansTC-Regular.ttf', 'NotoSansTC', 'normal');
      pdf.setFont('NotoSansTC');

      let y = 20;

      // Title
      pdf.setFontSize(18);
      const titleLines = pdf.splitTextToSize(article.title, 180);
      pdf.text(titleLines, 15, y);
      y += titleLines.length * 8 + 4;

      // First image if available
      if (images.length > 0) {
        try {
          const first = images[0];
          const url = first.image_url.startsWith('http') || first.image_url.startsWith('data:')
            ? first.image_url
            : `https://autowriter.ai.com.tw${first.image_url}`;
          const { dataUrl, format } = await toDataUrl(url);
          const img = new Image();
          const dim = await new Promise<{ w: number; h: number }>((resolve) => {
            img.onload = () => resolve({ w: img.width, h: img.height });
            img.src = dataUrl;
          });
          const maxW = 180;
          const h = (dim.h * maxW) / dim.w;
          pdf.addImage(dataUrl, format, 15, y, maxW, h);
          y += h + 8;
        } catch (e) {
          console.warn('PDF 圖片嵌入失敗，將僅輸出文字', e);
        }
      }

      // Content text
      pdf.setFontSize(12);
      const contentLines = pdf.splitTextToSize(article.content, 180);
      for (const line of contentLines) {
        if (y > 285) {
          pdf.addPage();
          pdf.setFont('NotoSansTC');
          pdf.setFontSize(12);
          y = 20;
        }
        pdf.text(line, 15, y);
        y += 6;
      }

      pdf.save(`${article.title}.pdf`);
    } catch (err) {
      console.error('PDF 下載失敗:', err);
    } finally {
      setDownloading(false);
    }
  };

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

          // 獲取文章圖片
          try {
            const imageResponse = await fetch(`${API_BASE_URL}/get-images.php?article_id=${id}`);
            if (imageResponse.ok) {
              const imageResult = await imageResponse.json();
              if (imageResult.success && imageResult.data) {
                setImages(imageResult.data);
              }
            }
          } catch (imgErr) {
            console.error("載入圖片失敗:", imgErr);
          }
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
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => navigate("/articles")}
            variant="ghost"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回文章列表
          </Button>
          
          <div className="flex gap-2">
            <SendToWordPressDialog articleId={parseInt(id!)} variant="default" size="default" />
            <Button
              onClick={downloadAsWord}
              disabled={downloading}
              variant="outline"
            >
              <FileDown className="mr-2 h-4 w-4" />
              下載 Word
            </Button>
            <Button
              onClick={downloadAsPDF}
              disabled={downloading}
              variant="outline"
            >
              <FileDown className="mr-2 h-4 w-4" />
              下載 PDF
            </Button>
          </div>
        </div>

        <Card id="article-content">
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
            {/* 文章配圖：首圖置頂，文字一起顯示，其餘做為圖集 */}
            {images.length > 0 && (() => {
              const first = images[0];
              const rest = images.slice(1);
               const firstUrl = first.image_url.startsWith('http') || first.image_url.startsWith('data:') 
                ? first.image_url 
                : `https://autowriter.ai.com.tw${first.image_url}`;
              return (
                <div className="mb-6">
                  <figure className="rounded-lg overflow-hidden border">
                    <img
                      src={firstUrl}
                      alt={first.prompt || article.title}
                      className="w-full h-auto object-cover"
                      loading="lazy"
                      onError={(e) => {
                        console.error('圖片載入失敗:', firstUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {first.prompt && (
                      <figcaption className="p-2 bg-muted text-xs text-muted-foreground">
                        {first.prompt}
                      </figcaption>
                    )}
                  </figure>
                  {rest.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {rest.map((image) => {
                         const url = image.image_url.startsWith('http') || image.image_url.startsWith('data:') 
                          ? image.image_url 
                          : `https://autowriter.ai.com.tw${image.image_url}`;
                        return (
                          <div key={image.id} className="rounded-lg overflow-hidden border">
                            <img
                              src={url}
                              alt={image.prompt || article.title}
                              className="w-full h-auto object-cover"
                              loading="lazy"
                              onError={(e) => {
                                console.error('圖片載入失敗:', url);
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            {image.prompt && (
                              <div className="p-2 bg-muted text-xs text-muted-foreground">
                                {image.prompt}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <Separator className="my-6" />
                </div>
              );
            })()}

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
      </div>
    </div>
  );
}
