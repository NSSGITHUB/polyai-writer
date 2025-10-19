import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, Tag } from "lucide-react";

interface ArticleContent {
  title: string;
  metaDescription: string;
  keywords: string[];
  content: {
    introduction: string;
    sections: Array<{
      heading: string;
      subheadings: Array<{
        title: string;
        content: string;
      }>;
    }>;
    conclusion: string;
  };
  publishedAt: string;
  readTime: string;
}

const ArticleView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleContent | null>(null);

  useEffect(() => {
    // 模擬文章資料（之後會從資料庫讀取）
    const mockArticle: ArticleContent = {
      title: "人工智慧在醫療領域的應用與未來發展",
      metaDescription: "探討人工智慧技術如何革新醫療診斷、治療方案及病患照護，以及未來在精準醫療領域的發展趨勢。",
      keywords: ["人工智慧", "醫療科技", "AI診斷", "精準醫療", "機器學習"],
      content: {
        introduction: "隨著科技的快速發展，人工智慧（AI）正在改變醫療產業的面貌。從疾病診斷到個人化治療方案，AI技術為醫療領域帶來前所未有的創新與效率提升。本文將深入探討AI在醫療領域的多元應用，以及未來可能的發展方向。",
        sections: [
          {
            heading: "AI在醫療診斷的突破性應用",
            subheadings: [
              {
                title: "影像辨識與疾病檢測",
                content: "深度學習技術使AI能夠分析醫療影像，如X光、CT掃描和MRI，協助醫師更快速、準確地診斷癌症、心血管疾病等重大疾病。研究顯示，AI在某些影像判讀任務上的準確率已達到或超越人類專家水準。"
              },
              {
                title: "早期預警系統",
                content: "透過機器學習演算法分析病患的生理數據和病歷記錄，AI系統能夠提前預警潛在健康風險，讓醫療團隊及早介入，大幅提升治療成功率。"
              }
            ]
          },
          {
            heading: "個人化醫療與治療方案",
            subheadings: [
              {
                title: "基因組學分析",
                content: "AI協助解析複雜的基因數據，為每位患者量身打造最適合的治療方案。這在癌症治療領域特別重要，能夠根據患者的基因特徵選擇最有效的藥物。"
              },
              {
                title: "藥物研發加速",
                content: "製藥公司運用AI技術加速新藥研發流程，從分子篩選到臨床試驗設計，大幅縮短藥物上市時間，並降低研發成本。"
              }
            ]
          },
          {
            heading: "遠距醫療與病患照護",
            subheadings: [
              {
                title: "智慧健康監測",
                content: "穿戴式裝置結合AI技術，能夠持續監測病患的健康狀況，自動偵測異常並即時通知醫療人員，特別適合慢性病患者的長期管理。"
              },
              {
                title: "虛擬醫療助理",
                content: "AI驅動的聊天機器人能夠提供24/7的醫療諮詢服務，回答常見健康問題，協助預約掛號，減輕醫療人員的工作負擔。"
              }
            ]
          }
        ],
        conclusion: "人工智慧正在重塑醫療產業的未來。雖然目前仍面臨數據隱私、演算法透明度等挑戰，但AI在提升診斷準確率、個人化治療及醫療效率方面的潛力不容忽視。隨著技術持續進步和法規逐步完善，我們可以期待AI將為全球醫療體系帶來更多突破性的創新，最終造福更多病患。"
      },
      publishedAt: new Date().toLocaleDateString("zh-TW"),
      readTime: "8分鐘閱讀"
    };

    setArticle(mockArticle);

    // 設定 SEO meta 標籤
    if (mockArticle) {
      document.title = `${mockArticle.title} | AI文章生成器`;
      
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", mockArticle.metaDescription);

      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement("meta");
        metaKeywords.setAttribute("name", "keywords");
        document.head.appendChild(metaKeywords);
      }
      metaKeywords.setAttribute("content", mockArticle.keywords.join(", "));
    }
  }, [id]);

  if (!article) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <p className="text-muted-foreground">載入中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/articles")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回文章列表
        </Button>

        <article className="space-y-6">
          <Card className="p-8 bg-gradient-card backdrop-blur-sm border-primary/20">
            {/* Article Header */}
            <header className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight">{article.title}</h1>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <time dateTime={article.publishedAt}>{article.publishedAt}</time>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{article.readTime}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {article.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {keyword}
                  </span>
                ))}
              </div>

              <p className="text-lg text-muted-foreground italic border-l-4 border-primary pl-4">
                {article.metaDescription}
              </p>
            </header>

            <Separator className="my-8" />

            {/* Article Content */}
            <div className="prose prose-lg max-w-none space-y-6">
              <section>
                <p className="text-base leading-relaxed">{article.content.introduction}</p>
              </section>

              {article.content.sections.map((section, sectionIdx) => (
                <section key={sectionIdx} className="space-y-4">
                  <h2 className="text-2xl font-semibold mt-8 mb-4">{section.heading}</h2>
                  
                  {section.subheadings.map((sub, subIdx) => (
                    <div key={subIdx} className="space-y-2">
                      <h3 className="text-xl font-medium mt-6 mb-3">{sub.title}</h3>
                      <p className="text-base leading-relaxed">{sub.content}</p>
                    </div>
                  ))}
                </section>
              ))}

              <section className="mt-8">
                <h2 className="text-2xl font-semibold mb-4">結論</h2>
                <p className="text-base leading-relaxed">{article.content.conclusion}</p>
              </section>
            </div>
          </Card>
        </article>
      </div>
    </div>
  );
};

export default ArticleView;
