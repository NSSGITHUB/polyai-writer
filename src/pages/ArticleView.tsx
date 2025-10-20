import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Hash, Globe, Wand2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

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
      </div>
    </div>
  );
}
