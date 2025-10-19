import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  FileText, 
  Image as ImageIcon, 
  PlusCircle,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const stats = [
    { label: "總文章數", value: "0", icon: FileText, color: "text-primary-glow" },
    { label: "本月生成", value: "0", icon: Zap, color: "text-accent" },
    { label: "AI配圖", value: "0", icon: ImageIcon, color: "text-success" },
    { label: "發布成功", value: "0", icon: TrendingUp, color: "text-primary" },
  ];

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">控制台</h1>
            <p className="text-muted-foreground">歡迎回來，開始創作精彩內容吧！</p>
          </div>
          <Button 
            className="bg-gradient-primary hover:shadow-glow"
            onClick={() => navigate("/generator")}
          >
            <PlusCircle className="mr-2 w-5 h-5" />
            新增文章
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card 
              key={index}
              className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
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
          >
            <TrendingUp className="w-12 h-12 text-success mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-xl font-semibold mb-2">數據分析</h3>
            <p className="text-muted-foreground">追蹤您的內容表現</p>
          </Card>
        </div>

        {/* Recent Articles */}
        <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
          <h2 className="text-2xl font-semibold mb-4">最近的文章</h2>
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
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
