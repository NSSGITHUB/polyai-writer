import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  Receipt,
  CreditCard,
  FileSpreadsheet,
  Landmark,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface AutomationStep {
  title: string;
  description: string;
}

interface WorkflowData {
  id: number;
  title: string;
  titleEn: string;
  icon: React.ElementType;
  color: string;
  content: string[];
  whyAutomate: string[];
  howToAutomate: AutomationStep[];
}

const workflows: WorkflowData[] = [
  {
    id: 1,
    title: "應收帳款",
    titleEn: "Accounts Receivable, AR",
    icon: Receipt,
    color: "text-primary-glow",
    content: [
      "開立發票",
      "寄送帳單",
      "收款對帳（銀行對帳）",
      "催款通知",
    ],
    whyAutomate: [
      "手動對帳耗時且易出錯",
      "催收延遲會直接影響現金流",
    ],
    howToAutomate: [
      { title: "自動開立電子發票", description: "系統根據訂單資料自動產生電子發票並寄送" },
      { title: "串接銀行 API", description: "自動核對入帳記錄，即時更新收款狀態" },
      { title: "自動催款通知", description: "設定到期提醒，自動發送 Email / 系統通知" },
    ],
  },
  {
    id: 2,
    title: "應付帳款",
    titleEn: "Accounts Payable, AP",
    icon: CreditCard,
    color: "text-accent",
    content: [
      "收取供應商發票",
      "發票審核與入帳",
      "付款排程與執行",
    ],
    whyAutomate: [
      "發票量大時人工處理效率低",
      "容易發生重複付款或漏付",
    ],
    howToAutomate: [
      { title: "OCR 辨識發票資料", description: "自動掃描並擷取供應商發票上的關鍵欄位" },
      { title: "自動建立會計分錄", description: "根據辨識結果自動生成對應的會計分錄" },
      { title: "自動付款排程", description: "批次支付排程，依到期日自動執行付款" },
    ],
  },
  {
    id: 3,
    title: "費用報銷",
    titleEn: "Expense Reimbursement",
    icon: FileSpreadsheet,
    color: "text-success",
    content: [
      "員工提交報銷單",
      "憑證審核",
      "入帳與付款",
    ],
    whyAutomate: [
      "人工審核流程冗長",
      "憑證整理與分類成本高",
    ],
    howToAutomate: [
      { title: "手機拍照上傳 + OCR", description: "員工拍照上傳收據，系統自動辨識金額與類別" },
      { title: "自動分類費用科目", description: "根據規則引擎自動歸類至對應會計科目" },
      { title: "工作流自動審批", description: "Workflow Approval 自動流轉簽核，加速報銷流程" },
    ],
  },
  {
    id: 4,
    title: "銀行對帳",
    titleEn: "Bank Reconciliation",
    icon: Landmark,
    color: "text-info",
    content: [
      "銀行交易 vs 帳務系統比對",
      "差異找出與調整",
    ],
    whyAutomate: [
      "高頻且重複性極高",
      "人工比對極易漏帳或錯帳",
    ],
    howToAutomate: [
      { title: "API 直接串接銀行", description: "即時取得銀行交易資料，無需人工下載對帳單" },
      { title: "規則引擎自動匹配", description: "依金額、日期、摘要等條件自動配對交易" },
      { title: "AI 輔助建議", description: "對未匹配項目提供智慧配對建議，提升對帳效率" },
    ],
  },
  {
    id: 5,
    title: "月結 / 財務報表生成",
    titleEn: "Month-End Closing",
    icon: CalendarCheck,
    color: "text-warning",
    content: [
      "各項帳務彙整",
      "調整分錄",
      "生成損益表、資產負債表",
    ],
    whyAutomate: [
      "月結時間長會影響決策速度",
      "人工整理容易出現數據不一致",
    ],
    howToAutomate: [
      { title: "自動彙整各模組數據", description: "串接 AR/AP/庫存等模組，自動彙總帳務資料" },
      { title: "預設分錄自動生成", description: "折舊、攤銷等固定調整分錄自動產生" },
      { title: "即時報表 Dashboard", description: "損益表、資產負債表、現金流量表一鍵生成" },
    ],
  },
];

const commonTraits = [
  { label: "高頻重複", description: "每天/每月都發生", icon: Zap },
  { label: "規則明確", description: "適合用系統邏輯處理", icon: CheckCircle2 },
  { label: "錯誤成本高", description: "直接影響現金流與財報", icon: AlertTriangle },
  { label: "可標準化", description: "容易建立 SOP 與系統化", icon: FileSpreadsheet },
];

const AccountingAutomation = () => {
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState<number | null>(1);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/auth");
    }
  }, [navigate]);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="sm"
            className="border-primary/30"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold">會計自動化流程</h1>
            <p className="text-muted-foreground">
              5 大高度適合自動化的會計工作流程
            </p>
          </div>
        </div>

        {/* Summary Traits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {commonTraits.map((trait, index) => (
            <Card
              key={index}
              className="p-4 bg-gradient-card backdrop-blur-sm border-primary/20 text-center"
            >
              <trait.icon className="w-6 h-6 mx-auto mb-2 text-primary-glow" />
              <p className="font-semibold text-sm">{trait.label}</p>
              <p className="text-xs text-muted-foreground">{trait.description}</p>
            </Card>
          ))}
        </div>

        {/* Workflow Cards */}
        <div className="space-y-4">
          {workflows.map((workflow) => {
            const isExpanded = expandedId === workflow.id;
            const IconComponent = workflow.icon;

            return (
              <Card
                key={workflow.id}
                className="bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all overflow-hidden"
              >
                {/* Clickable Header */}
                <div
                  className="p-6 cursor-pointer flex items-center justify-between"
                  onClick={() => toggleExpand(workflow.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-background/50">
                      <IconComponent className={`w-7 h-7 ${workflow.color}`} />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">
                        {workflow.id}. {workflow.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {workflow.titleEn}
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>

                {/* Expandable Content */}
                {isExpanded && (
                  <div className="px-6 pb-6 space-y-6">
                    {/* Content Items */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                        流程內容
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {workflow.content.map((item, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 rounded-full text-sm bg-primary/10 border border-primary/20"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Why Automate */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                        為何必須自動化
                      </h3>
                      <div className="space-y-2">
                        {workflow.whyAutomate.map((reason, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                            <span className="text-sm">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* How to Automate */}
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                        自動化方式
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {workflow.howToAutomate.map((step, i) => (
                          <Card
                            key={i}
                            className="p-4 bg-background/50 border-primary/10"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                              <span className="font-semibold text-sm">
                                {step.title}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground pl-6">
                              {step.description}
                            </p>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Summary Card */}
        <Card className="mt-8 p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
          <h2 className="text-xl font-bold mb-4">管理層視角總結</h2>
          <p className="text-muted-foreground mb-4">
            以上 5 個流程具備「高頻重複、規則明確、錯誤成本高、可標準化」的共通特性，
            是會計部門優先導入自動化的首選目標。透過自動化不僅能大幅提升效率、降低人為錯誤，
            更能讓會計團隊將精力投注在更具策略價值的分析與決策支援工作上。
          </p>
          <div className="flex gap-3">
            <Button
              className="bg-gradient-primary hover:shadow-glow"
              onClick={() => navigate("/dashboard")}
            >
              返回控制台
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AccountingAutomation;
