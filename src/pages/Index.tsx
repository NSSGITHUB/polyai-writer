import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Sparkles, 
  FileText, 
  Image as ImageIcon, 
  Globe, 
  Zap,
  Users,
  TrendingUp,
  Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-card/50 backdrop-blur-sm border border-primary/20 rounded-full">
            <Sparkles className="w-4 h-4 text-primary-glow" />
            <span className="text-sm text-muted-foreground">AI驅動的內容生成平台</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-primary bg-clip-text text-transparent leading-tight">
            多用戶版SEO內容
            <br />
            行銷文章AI寫作系統
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            整合OpenAI、Google Gemini、Anthropic Claude、xAI Grok四大AI模型，
            一鍵生成高質量SEO優化文章，自動發布至WordPress
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              onClick={() => navigate("/auth")}
            >
              開始免費試用
              <Sparkles className="ml-2 w-5 h-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary/30 hover:border-primary/60"
            >
              查看演示
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">核心功能</h2>
          <p className="text-muted-foreground">全方位的AI內容生成解決方案</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: FileText,
              title: "多模型AI生成",
              description: "同時調用四大AI模型，生成多樣化內容"
            },
            {
              icon: ImageIcon,
              title: "AI配圖生成",
              description: "自動生成符合文章主題的精美插圖"
            },
            {
              icon: Globe,
              title: "自動發布",
              description: "一鍵發布至WordPress和社群媒體"
            },
            {
              icon: TrendingUp,
              title: "SEO優化",
              description: "內建SEO分析工具，提升搜尋排名"
            },
            {
              icon: Users,
              title: "多用戶管理",
              description: "完整的權限管理和帳務系統"
            },
            {
              icon: Zap,
              title: "高效排程",
              description: "智能排程發布，提升工作效率"
            },
            {
              icon: Shield,
              title: "安全可靠",
              description: "企業級安全保護，數據加密存儲"
            },
            {
              icon: Sparkles,
              title: "多語言支持",
              description: "支援多國語言文章生成"
            }
          ].map((feature, index) => (
            <Card 
              key={index}
              className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 hover:shadow-card transition-all duration-300 group"
            >
              <feature.icon className="w-12 h-12 text-primary-glow mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="p-12 text-center bg-gradient-card backdrop-blur-sm border-primary/20 shadow-glow">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            準備好開始了嗎？
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            立即註冊，體驗AI驅動的內容創作革命
          </p>
          <Button 
            size="lg"
            className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
            onClick={() => navigate("/auth")}
          >
            免費開始使用
            <Sparkles className="ml-2 w-5 h-5" />
          </Button>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-primary/20">
        <div className="text-center text-muted-foreground">
          <p>© 2025 SEO AI Writer. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
