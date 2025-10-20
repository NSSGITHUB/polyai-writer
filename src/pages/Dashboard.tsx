import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  FileText, 
  Image as ImageIcon, 
  PlusCircle,
  TrendingUp,
  Users,
  Zap,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

interface Article {
  id: number;
  title: string;
  excerpt: string;
  ai_provider: string;
  word_count: number;
  created_at: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    withImages: 0,
    published: 0,
    totalImages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [latestArticle, setLatestArticle] = useState<Article | null>(null);

  useEffect(() => {
    // Check authentication
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/auth');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      setUserName(user.name || user.email);
      fetchStats(user.id);
      fetchLatestArticle();
    } catch (error) {
      navigate('/auth');
    }
  }, [navigate]);

  const fetchStats = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/get-stats.php?user_id=${userId}`);
      const data = await response.json();
      
      if (data.success && data.stats) {
        setStats({
          total: data.stats.total,
          thisMonth: data.stats.monthly,
          withImages: data.stats.with_images,
          published: data.stats.published,
          totalImages: data.stats.total_images || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
      toast({
        title: "載入失敗",
        description: "無法獲取統計數據",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLatestArticle = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/get-articles.php?page=1&limit=1`);
      const data = await response.json();
      
      if (data.success && data.data && data.data.length > 0) {
        setLatestArticle(data.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch latest article:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast({
      title: "已登出",
      description: "期待您的再次光臨",
    });
    navigate('/auth');
  };

  const statsData = [
    { label: "總文章數", value: stats.total.toString(), icon: FileText, color: "text-primary-glow" },
    { label: "本月生成", value: stats.thisMonth.toString(), icon: Zap, color: "text-accent" },
    { label: "AI配圖", value: stats.withImages.toString(), icon: ImageIcon, color: "text-success" },
    { label: "發布成功", value: stats.published.toString(), icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">控制台</h1>
            <p className="text-muted-foreground">歡迎回來，{userName}！開始創作精彩內容吧！</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              className="border-primary/30"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 w-5 h-5" />
              登出
            </Button>
            <Button 
              className="bg-gradient-primary hover:shadow-glow"
              onClick={() => navigate("/generator")}
            >
              <PlusCircle className="mr-2 w-5 h-5" />
              新增文章
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <Card 
              key={index}
              className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">
                    {isLoading ? "..." : stat.value}
                  </p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card 
            className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 hover:shadow-card transition-all cursor-pointer group"
            onClick={() => navigate("/generator")}
          >
            <FileText className="w-12 h-12 text-primary-glow mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-2">生成文章</h3>
            <p className="text-muted-foreground">使用AI快速生成SEO優化文章</p>
          </Card>

          <Card 
            className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 hover:shadow-card transition-all cursor-pointer group"
            onClick={() => navigate("/articles")}
          >
            <Users className="w-12 h-12 text-accent mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-2">文章管理</h3>
            <p className="text-muted-foreground">查看和編輯您的所有文章</p>
          </Card>

          <Card 
            className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 hover:shadow-card transition-all cursor-pointer group"
            onClick={() => navigate("/seo-analyzer")}
          >
            <TrendingUp className="w-12 h-12 text-success mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-2">SEO 分析</h3>
            <p className="text-muted-foreground">分析文章 SEO 表現與優化建議</p>
          </Card>

          <Card 
            className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 hover:shadow-card transition-all cursor-pointer group"
            onClick={() => navigate("/image-generator")}
          >
            <ImageIcon className="w-12 h-12 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-2">AI 配圖</h3>
            <p className="text-muted-foreground mb-3">為文章生成精美的 AI 配圖</p>
            {!isLoading && stats.totalImages > 0 && (
              <div className="mt-2 pt-2 border-t border-primary/10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate("/image-gallery");
                  }}
                >
                  查看 {stats.totalImages} 張生成圖片
                </Button>
              </div>
            )}
          </Card>
        </div>

        {/* Recent Articles */}
        <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">最近的文章</h2>
            <Button 
              variant="outline"
              size="sm"
              className="border-primary/30"
              onClick={() => navigate("/articles")}
            >
              查看全部
            </Button>
          </div>
          
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">載入中...</div>
          ) : latestArticle ? (
            <Card className="p-4 bg-background/50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{latestArticle.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {latestArticle.excerpt}...
                  </p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>🤖 {latestArticle.ai_provider}</span>
                    <span>📝 {latestArticle.word_count} 字</span>
                    <span>📅 {new Date(latestArticle.created_at).toLocaleDateString("zh-TW")}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-4"
                  onClick={() => navigate(`/articles/${latestArticle.id}`)}
                >
                  檢視
                </Button>
              </div>
            </Card>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="mb-4">還沒有任何文章</p>
              <Button 
                variant="outline"
                className="border-primary/30"
                onClick={() => navigate("/generator")}
              >
                立即創建第一篇文章
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
