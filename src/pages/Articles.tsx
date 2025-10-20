import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = "https://seo.ai.com.tw/api";

interface Article {
  id: number;
  title: string;
  excerpt: string;
  topic: string;
  keywords: string;
  language: string;
  style: string;
  word_count: number;
  ai_provider: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const setMeta = (title: string, description: string) => {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", description);
};

const Articles = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMeta(
      "文章管理 | AI 內容產生器",
      "管理以多模型生成的文章，快速建立、檢視與後續優化。"
    );
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-articles.php`);
      const data = await response.json();
      
      if (data.success) {
        setArticles(data.data || []);
      } else {
        toast({
          title: "載入失敗",
          description: data.error || "無法載入文章列表",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "載入失敗",
        description: "無法連線到伺服器",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("確定要刪除這篇文章嗎？")) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/delete-article.php?id=${id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        toast({
          title: "刪除成功",
          description: "文章已刪除",
        });
        fetchArticles();
      } else {
        toast({
          title: "刪除失敗",
          description: "無法刪除文章",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "刪除失敗",
        description: "無法連線到伺服器",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="container mx-auto px-4 pt-8">
        <h1 className="text-3xl font-bold">文章管理</h1>
        <p className="text-muted-foreground mt-1">查看最近生成的文章與後續操作</p>
      </header>

      <main className="container mx-auto px-4 py-8 grid gap-6">
        <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">最近文章</h2>
              <p className="text-sm text-muted-foreground">
                {loading ? "載入中..." : `共 ${articles.length} 篇文章`}
              </p>
            </div>
            <Button onClick={() => navigate("/generator")} className="bg-gradient-primary hover:shadow-glow">
              建立新文章
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">載入中...</div>
          ) : articles.length === 0 ? (
            <>
              <Separator className="my-6" />
              <div className="text-sm text-muted-foreground">
                尚未有任何文章記錄。按下「建立新文章」開始創作。
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <Card key={article.id} className="p-4 bg-background/50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{article.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {article.excerpt}...
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>🤖 {article.ai_provider}</span>
                        <span>📝 {article.word_count} 字</span>
                        <span>🌐 {article.language}</span>
                        <span>📅 {new Date(article.created_at).toLocaleDateString("zh-TW")}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`${API_BASE_URL}/get-article.php?id=${article.id}`, "_blank")}
                      >
                        檢視
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(article.id)}
                      >
                        刪除
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default Articles;
