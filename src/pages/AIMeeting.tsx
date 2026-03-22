import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  MessageSquare,
  Play,
  Loader2,
  Users,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

interface Agent {
  id: number;
  name: string;
  title: string;
  avatar_emoji: string;
  role: string;
}

interface DiscussionEntry {
  agent_id: number | null;
  agent_name: string;
  agent_title: string;
  agent_emoji: string;
  round: number;
  content: string;
  type: string;
}

interface Meeting {
  id: number;
  title: string;
  agenda: string;
  meeting_type: string;
  status: string;
  discussion: string | null;
  summary: string | null;
  created_at: string;
  completed_at: string | null;
  participants?: Agent[];
}

const AIMeeting = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [agents, setAgents] = useState<Agent[]>([]);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [discussion, setDiscussion] = useState<DiscussionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [agenda, setAgenda] = useState("");
  const [meetingType, setMeetingType] = useState("strategy");
  const [selectedAgentIds, setSelectedAgentIds] = useState<number[]>([]);

  const getUserId = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { navigate("/auth"); return ""; }
    try { return JSON.parse(userStr).id; } catch { navigate("/auth"); return ""; }
  };

  const fetchAgents = async () => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ai-company/agents.php?user_id=${userId}`);
      const data = await res.json();
      if (data.success) setAgents(data.agents || []);
    } catch (error) {
      console.error("Failed to fetch agents:", error);
    }
  };

  const fetchMeeting = async (meetingId: string) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ai-company/meetings.php?user_id=${userId}&meeting_id=${meetingId}`);
      const data = await res.json();
      if (data.success && data.meeting) {
        setMeeting(data.meeting);
        if (data.meeting.discussion) {
          try {
            setDiscussion(JSON.parse(data.meeting.discussion));
          } catch {
            setDiscussion([]);
          }
        }
        if (data.meeting.participants) {
          setSelectedAgentIds(data.meeting.participants.map((p: Agent) => p.id));
        }
      }
    } catch (error) {
      console.error("Failed to fetch meeting:", error);
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchAgents();
      const meetingId = searchParams.get("id");
      if (meetingId) await fetchMeeting(meetingId);
      setIsLoading(false);
    };
    load();
  }, []);

  const toggleAgent = (agentId: number) => {
    setSelectedAgentIds((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const selectAllCLevel = () => {
    const cLevelIds = agents.filter((a) => a.role === "c-level").map((a) => a.id);
    setSelectedAgentIds(cLevelIds);
  };

  const handleCreateAndRun = async () => {
    const userId = getUserId();
    if (!userId) return;

    if (!title || !agenda) {
      toast({ title: "請填寫會議標題和議題", variant: "destructive" });
      return;
    }
    if (selectedAgentIds.length < 2) {
      toast({ title: "至少需要 2 位參與者", variant: "destructive" });
      return;
    }

    setIsRunning(true);
    try {
      // Step 1: Create the meeting
      const createRes = await fetch(`${API_BASE_URL}/ai-company/meetings.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          title,
          agenda,
          meeting_type: meetingType,
          participant_ids: selectedAgentIds,
        }),
      });
      const createData = await createRes.json();

      if (!createData.success) throw new Error(createData.error);

      const meetingId = createData.meeting_id;

      toast({ title: "會議已建立", description: "AI 們正在激烈討論中..." });

      // Step 2: Run the meeting
      const runRes = await fetch(`${API_BASE_URL}/ai-company/run-meeting.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: meetingId, user_id: userId }),
      });
      const runData = await runRes.json();

      if (!runData.success) throw new Error(runData.error);

      setMeeting(runData.meeting);
      setDiscussion(runData.discussion || []);

      toast({ title: "會議完成！", description: "高管們已完成討論，決策建議已整理好" });
    } catch (error: any) {
      toast({
        title: "會議失敗",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRerunMeeting = async () => {
    if (!meeting) return;
    const userId = getUserId();
    if (!userId) return;

    setIsRunning(true);
    try {
      const res = await fetch(`${API_BASE_URL}/ai-company/run-meeting.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meeting_id: meeting.id, user_id: userId }),
      });
      const data = await res.json();
      if (data.success) {
        setMeeting(data.meeting);
        setDiscussion(data.discussion || []);
        toast({ title: "會議完成！" });
      }
    } catch (error: any) {
      toast({ title: "會議失敗", description: error.message, variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  };

  const getRoundLabel = (round: number) => {
    if (round === 1) return "第一輪：觀點陳述";
    if (round === 2) return "第二輪：辯論交鋒";
    return "會議總結";
  };

  // Group discussion by round
  const discussionByRound = discussion.reduce<Record<number, DiscussionEntry[]>>(
    (acc, entry) => {
      if (!acc[entry.round]) acc[entry.round] = [];
      acc[entry.round].push(entry);
      return acc;
    },
    {}
  );

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/ai-company")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-primary" />
              {meeting ? meeting.title : "召開新會議"}
            </h1>
            <p className="text-muted-foreground">
              {meeting
                ? `${meeting.meeting_type === "strategy" ? "策略" : meeting.meeting_type === "brainstorm" ? "腦力激盪" : meeting.meeting_type === "review" ? "檢討" : meeting.meeting_type === "crisis" ? "危機處理" : "例行"}會議`
                : "選擇議題和參與者，讓 AI 高管們進行辯論"}
            </p>
          </div>
        </div>

        {/* Running Overlay */}
        {isRunning && (
          <Card className="p-8 bg-gradient-card border-primary/20 text-center mb-8 animate-pulse">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
            <h2 className="text-xl font-bold mb-2">AI 高管們正在激烈討論中...</h2>
            <p className="text-muted-foreground">
              他們正在針對議題發表觀點、互相辯論、最後整理出決策建議給你參考。
              <br />
              這可能需要 1-3 分鐘，請稍候。
            </p>
          </Card>
        )}

        {/* Meeting Setup (if no meeting loaded) */}
        {!meeting && !isRunning && (
          <div className="space-y-6">
            <Card className="p-6 bg-gradient-card border-primary/20">
              <h2 className="text-lg font-semibold mb-4">會議設定</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">會議標題 *</label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例：Q2 產品戰略方向討論"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">會議議題 *</label>
                  <Textarea
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    placeholder="詳細描述需要討論的議題，例：我們的 SaaS 產品目前月營收 50 萬，想在 Q2 突破 100 萬。請各位就行銷、產品、技術、財務等面向提出策略建議..."
                    rows={4}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">會議類型</label>
                  <Select value={meetingType} onValueChange={setMeetingType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="strategy">策略會議</SelectItem>
                      <SelectItem value="brainstorm">腦力激盪</SelectItem>
                      <SelectItem value="review">檢討會議</SelectItem>
                      <SelectItem value="crisis">危機處理</SelectItem>
                      <SelectItem value="regular">例行會議</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-gradient-card border-primary/20">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  選擇與會人員 ({selectedAgentIds.length})
                </h2>
                <Button variant="outline" size="sm" onClick={selectAllCLevel}>
                  全選 C-Level
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => toggleAgent(agent.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedAgentIds.includes(agent.id)
                        ? "border-primary bg-primary/10"
                        : "border-primary/20 hover:border-primary/40"
                    }`}
                  >
                    <span className="text-2xl">{agent.avatar_emoji}</span>
                    <p className="font-medium text-sm mt-1">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.title}</p>
                  </button>
                ))}
              </div>
            </Card>

            <Button
              size="lg"
              className="w-full bg-gradient-primary hover:shadow-glow text-lg"
              onClick={handleCreateAndRun}
              disabled={isRunning || !title || !agenda || selectedAgentIds.length < 2}
            >
              <Play className="mr-2 w-5 h-5" />
              開始會議 — 讓 AI 們開始討論
            </Button>
          </div>
        )}

        {/* Meeting Results */}
        {meeting && meeting.status === "completed" && !isRunning && (
          <div className="space-y-6">
            {/* Meeting Info */}
            <Card className="p-5 bg-gradient-card border-primary/20">
              <p className="text-sm text-muted-foreground mb-2">會議議題</p>
              <p>{meeting.agenda}</p>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span>開始：{new Date(meeting.created_at).toLocaleString("zh-TW")}</span>
                {meeting.completed_at && (
                  <span>結束：{new Date(meeting.completed_at).toLocaleString("zh-TW")}</span>
                )}
              </div>
            </Card>

            {/* Discussion Rounds */}
            {Object.entries(discussionByRound).map(([round, entries]) => (
              <div key={round}>
                <h3 className="text-lg font-bold mb-3 text-primary">
                  {getRoundLabel(parseInt(round))}
                </h3>
                <div className="space-y-4">
                  {entries.map((entry, idx) => (
                    <Card
                      key={idx}
                      className={`p-5 border-primary/20 ${
                        entry.type === "summary"
                          ? "bg-primary/5 border-primary/40"
                          : entry.type === "debate"
                          ? "bg-orange-500/5 border-orange-500/20"
                          : "bg-gradient-card"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{entry.agent_emoji}</span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-bold">{entry.agent_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {entry.agent_title}
                            </span>
                            {entry.type === "debate" && (
                              <span className="text-xs px-2 py-0.5 rounded bg-orange-500/20 text-orange-400">
                                辯論
                              </span>
                            )}
                            {entry.type === "summary" && (
                              <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                                總結
                              </span>
                            )}
                          </div>
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">
                            {entry.content}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/ai-company/decisions")}
              >
                查看決策建議
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMeeting(null);
                  setDiscussion([]);
                  setTitle("");
                  setAgenda("");
                  setSelectedAgentIds([]);
                }}
              >
                召開新會議
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIMeeting;
