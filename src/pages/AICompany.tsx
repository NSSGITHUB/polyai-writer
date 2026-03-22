import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Users,
  MessageSquare,
  ClipboardCheck,
  PlusCircle,
  ArrowLeft,
  Building2,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

interface Agent {
  id: number;
  name: string;
  title: string;
  role: string;
  c_level_type: string | null;
  avatar_emoji: string;
  status: string;
  skill_count: number;
}

interface MeetingSummary {
  id: number;
  title: string;
  status: string;
  meeting_type: string;
  participant_count: number;
  created_at: string;
}

const AICompany = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [meetings, setMeetings] = useState<MeetingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);

  const getUserId = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/auth");
      return "";
    }
    try {
      return JSON.parse(userStr).id;
    } catch {
      navigate("/auth");
      return "";
    }
  };

  const fetchData = async () => {
    const userId = getUserId();
    if (!userId) return;
    setIsLoading(true);
    try {
      const [agentsRes, meetingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/ai-company/agents.php?user_id=${userId}`),
        fetch(`${API_BASE_URL}/ai-company/meetings.php?user_id=${userId}`),
      ]);
      const agentsData = await agentsRes.json();
      const meetingsData = await meetingsRes.json();

      if (agentsData.success) setAgents(agentsData.agents || []);
      if (meetingsData.success) setMeetings(meetingsData.meetings || []);
    } catch (error) {
      console.error("Failed to fetch AI company data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInitTeam = async () => {
    const userId = getUserId();
    if (!userId) return;
    setIsInitializing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai-company/init-team.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: data.already_exists ? "團隊已存在" : "🎉 團隊建立成功！",
          description: data.already_exists
            ? "您的 C-Level 團隊已經就位"
            : "已聘請 7 位 C-Level 主管，準備為您效力！",
        });
        fetchData();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "建立失敗",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const cLevelAgents = agents.filter((a) => a.role === "c-level");
  const recentMeetings = meetings.slice(0, 5);
  const pendingDecisions = meetings.filter((m) => m.status === "completed").length;

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="w-8 h-8 text-primary" />
                AI 公司總部
              </h1>
              <p className="text-muted-foreground">
                你的 AI 高管團隊，隨時為你做出最佳決策
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate("/ai-company/agents")}
            >
              <Users className="mr-2 w-4 h-4" />
              員工管理
            </Button>
            <Button
              className="bg-gradient-primary hover:shadow-glow"
              onClick={() => navigate("/ai-company/meeting")}
            >
              <MessageSquare className="mr-2 w-4 h-4" />
              召開會議
            </Button>
          </div>
        </div>

        {/* Empty State - No team yet */}
        {!isLoading && agents.length === 0 && (
          <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold mb-3">歡迎來到 AI 公司！</h2>
            <p className="text-muted-foreground mb-2 max-w-lg mx-auto">
              一鍵聘請 7 位 C-Level 高管（CEO、CTO、CMO、CFO、COO、CPO、CHRO），
              讓他們為你開會討論、辯論決策、提供專業建議。
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              每位高管都有獨特的個性、專長和記憶系統，會自主學習和累積經驗。
            </p>
            <Button
              size="lg"
              className="bg-gradient-primary hover:shadow-glow text-lg px-8"
              onClick={handleInitTeam}
              disabled={isInitializing}
            >
              {isInitializing ? (
                "正在聘請團隊..."
              ) : (
                <>
                  <UserPlus className="mr-2 w-5 h-5" />
                  一鍵組建 C-Level 團隊
                </>
              )}
            </Button>
          </Card>
        )}

        {/* Stats */}
        {agents.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">AI 員工</p>
                    <p className="text-3xl font-bold">{agents.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">C-Level 主管</p>
                    <p className="text-3xl font-bold">{cLevelAgents.length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-accent" />
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">已開會議</p>
                    <p className="text-3xl font-bold">{meetings.length}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-success" />
                </div>
              </Card>
              <Card className="p-6 bg-gradient-card backdrop-blur-sm border-primary/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">決策建議</p>
                    <p className="text-3xl font-bold">{pendingDecisions}</p>
                  </div>
                  <ClipboardCheck className="w-8 h-8 text-warning" />
                </div>
              </Card>
            </div>

            {/* C-Level Team Grid */}
            <h2 className="text-2xl font-bold mb-4">C-Level 高管團隊</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {cLevelAgents.map((agent) => (
                <Card
                  key={agent.id}
                  className="p-5 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all cursor-pointer group"
                  onClick={() =>
                    navigate(`/ai-company/agents?id=${agent.id}`)
                  }
                >
                  <div className="text-4xl mb-3">{agent.avatar_emoji}</div>
                  <h3 className="text-lg font-bold">{agent.name}</h3>
                  <p className="text-sm text-primary mb-1">{agent.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {agent.skill_count} 項技能
                  </p>
                  <div className="mt-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        agent.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {agent.status === "active" ? "在線" : "離線"}
                    </span>
                  </div>
                </Card>
              ))}

              {/* Add new agent card */}
              <Card
                className="p-5 bg-gradient-card backdrop-blur-sm border-dashed border-primary/30 hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px]"
                onClick={() => navigate("/ai-company/agents?new=true")}
              >
                <PlusCircle className="w-10 h-10 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">聘請新員工</p>
              </Card>
            </div>

            {/* Recent Meetings */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">最近會議</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/ai-company/decisions")}
              >
                <ClipboardCheck className="mr-2 w-4 h-4" />
                決策紀錄
              </Button>
            </div>

            {recentMeetings.length > 0 ? (
              <div className="space-y-3">
                {recentMeetings.map((m) => (
                  <Card
                    key={m.id}
                    className="p-4 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/40 transition-all cursor-pointer"
                    onClick={() =>
                      navigate(`/ai-company/meeting?id=${m.id}`)
                    }
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold">{m.title}</h3>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                          <span>
                            {m.meeting_type === "strategy"
                              ? "策略會議"
                              : m.meeting_type === "brainstorm"
                              ? "腦力激盪"
                              : m.meeting_type === "review"
                              ? "檢討會議"
                              : m.meeting_type === "crisis"
                              ? "危機處理"
                              : "例行會議"}
                          </span>
                          <span>{m.participant_count} 人參與</span>
                          <span>
                            {new Date(m.created_at).toLocaleDateString("zh-TW")}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`text-xs px-3 py-1 rounded-full ${
                          m.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : m.status === "in_progress"
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {m.status === "completed"
                          ? "已完成"
                          : m.status === "in_progress"
                          ? "進行中"
                          : "待開始"}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground mb-3">
                  還沒有開過會議
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("/ai-company/meeting")}
                >
                  召開第一場會議
                </Button>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AICompany;
