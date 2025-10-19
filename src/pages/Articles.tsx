import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";

const setMeta = (title: string, description: string) => {
  document.title = title;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.setAttribute("content", description);
};

const Articles = () => {
  const navigate = useNavigate();

  useEffect(() => {
    setMeta(
      "文章管理 | AI 內容產生器",
      "管理以多模型生成的文章，快速建立、檢視與後續優化。"
    );
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="container mx-auto px-4 pt-8">
        <h1 className="text-3xl font-bold">文章管理</h1>
        <p className="text-muted-foreground mt-1">查看最近生成的文章與後續操作</p>
      </header>

      <main className="container mx-auto px-4 py-8 grid gap-6">
        <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">最近文章</h2>
              <p className="text-sm text-muted-foreground">目前尚無資料，先生成第一篇文章吧！</p>
            </div>
            <Button onClick={() => navigate("/generator")} className="bg-gradient-primary hover:shadow-glow">
              建立新文章
            </Button>
          </div>

          <Separator className="my-6" />

          <div className="text-sm text-muted-foreground">
            尚未有任何文章記錄。按下「建立新文章」開始創作。
          </div>
        </Card>
      </main>
    </div>
  );
};

export default Articles;
