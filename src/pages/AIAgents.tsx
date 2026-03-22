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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  PlusCircle,
  Brain,
  BookOpen,
  Briefcase,
  Trash2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

interface Skill {
  id: number;
  name: string;
  category: string;
  description: string;
  proficiency?: number;
}

interface Memory {
  id: number;
  memory_type: string;
  content: string;
  importance: number;
  created_at: string;
}

interface WorkLog {
  id: number;
  log_type: string;
  content: string;
  created_at: string;
}

interface AgentDetail {
  id: number;
  name: string;
  title: string;
  role: string;
  c_level_type: string | null;
  personality: string;
  responsibilities: string;
  avatar_emoji: string;
  ai_provider: string;
  status: string;
  skills: Skill[];
  recent_memories: Memory[];
  recent_logs: WorkLog[];
}

interface AgentListItem {
  id: number;
  name: string;
  title: string;
  role: string;
  c_level_type: string | null;
  avatar_emoji: string;
  status: string;
  skill_count: number;
}

const EMOJI_OPTIONS = ["🤖", "👔", "💻", "📣", "💰", "⚙️", "🎯", "🤝", "🧠", "🦾", "👨‍💼", "👩‍💼", "🏗️", "📊", "🔬"];

const AIAgents = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [agents, setAgents] = useState<AgentListItem[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentDetail | null>(null);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Create form state
  const [newAgent, setNewAgent] = useState({
    name: "",
    title: "",
    role: "employee" as string,
    c_level_type: "",
    avatar_emoji: "🤖",
    ai_provider: "openai",
    responsibilities: "",
    personality_traits: "",
    personality_comm: "",
    personality_decision: "",
    skill_ids: [] as number[],
  });

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

  const fetchAgentDetail = async (agentId: number) => {
    const userId = getUserId();
    if (!userId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ai-company/agents.php?user_id=${userId}&agent_id=${agentId}`);
      const data = await res.json();
      if (data.success) setSelectedAgent(data.agent);
    } catch (error) {
      console.error("Failed to fetch agent detail:", error);
    }
  };

  const fetchSkills = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai-company/skills.php`);
      const data = await res.json();
      if (data.success) setAllSkills(data.skills || []);
    } catch (error) {
      console.error("Failed to fetch skills:", error);
    }
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchAgents(), fetchSkills()]);
      const idParam = searchParams.get("id");
      if (idParam) await fetchAgentDetail(parseInt(idParam));
      if (searchParams.get("new") === "true") setShowCreateDialog(true);
      setIsLoading(false);
    };
    load();
  }, []);

  const handleCreate = async () => {
    const userId = getUserId();
    if (!userId) return;

    if (!newAgent.name || !newAgent.title) {
      toast({ title: "請填寫姓名和職稱", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/ai-company/agents.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          name: newAgent.name,
          title: newAgent.title,
          role: newAgent.role,
          c_level_type: newAgent.c_level_type || null,
          avatar_emoji: newAgent.avatar_emoji,
          ai_provider: newAgent.ai_provider,
          responsibilities: newAgent.responsibilities,
          personality: {
            traits: newAgent.personality_traits,
            communication_style: newAgent.personality_comm,
            decision_style: newAgent.personality_decision,
          },
          skill_ids: newAgent.skill_ids,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "聘請成功！", description: `${newAgent.name} 已加入團隊` });
        setShowCreateDialog(false);
        setNewAgent({
          name: "", title: "", role: "employee", c_level_type: "",
          avatar_emoji: "🤖", ai_provider: "openai", responsibilities: "",
          personality_traits: "", personality_comm: "", personality_decision: "",
          skill_ids: [],
        });
        fetchAgents();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({ title: "聘請失敗", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async (agentId: number, agentName: string) => {
    if (!confirm(`確定要解僱 ${agentName} 嗎？此操作無法復原。`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/ai-company/agents.php?agent_id=${agentId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "已解僱", description: `${agentName} 已離開團隊` });
        setSelectedAgent(null);
        fetchAgents();
      }
    } catch (error: any) {
      toast({ title: "操作失敗", description: error.message, variant: "destructive" });
    }
  };

  const toggleSkill = (skillId: number) => {
    setNewAgent((prev) => ({
      ...prev,
      skill_ids: prev.skill_ids.includes(skillId)
        ? prev.skill_ids.filter((id) => id !== skillId)
        : [...prev.skill_ids, skillId],
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/ai-company")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">AI 員工管理</h1>
              <p className="text-muted-foreground">管理你的 AI 團隊成員</p>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:shadow-glow">
                <PlusCircle className="mr-2 w-4 h-4" />
                聘請新員工
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>聘請新 AI 員工</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* Emoji picker */}
                <div>
                  <label className="text-sm font-medium mb-2 block">頭像</label>
                  <div className="flex gap-2 flex-wrap">
                    {EMOJI_OPTIONS.map((e) => (
                      <button
                        key={e}
                        onClick={() => setNewAgent((p) => ({ ...p, avatar_emoji: e }))}
                        className={`text-2xl p-2 rounded-lg border ${newAgent.avatar_emoji === e ? "border-primary bg-primary/20" : "border-transparent hover:border-primary/30"}`}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">姓名 *</label>
                    <Input
                      value={newAgent.name}
                      onChange={(e) => setNewAgent((p) => ({ ...p, name: e.target.value }))}
                      placeholder="例：陳策略"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">職稱 *</label>
                    <Input
                      value={newAgent.title}
                      onChange={(e) => setNewAgent((p) => ({ ...p, title: e.target.value }))}
                      placeholder="例：數據分析師"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">層級</label>
                    <Select value={newAgent.role} onValueChange={(v) => setNewAgent((p) => ({ ...p, role: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="c-level">C-Level 主管</SelectItem>
                        <SelectItem value="manager">經理</SelectItem>
                        <SelectItem value="employee">一般員工</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">AI 模型</label>
                    <Select value={newAgent.ai_provider} onValueChange={(v) => setNewAgent((p) => ({ ...p, ai_provider: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI GPT</SelectItem>
                        <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                        <SelectItem value="google">Google Gemini</SelectItem>
                        <SelectItem value="xai">xAI Grok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">職責範圍</label>
                  <Textarea
                    value={newAgent.responsibilities}
                    onChange={(e) => setNewAgent((p) => ({ ...p, responsibilities: e.target.value }))}
                    placeholder="描述此員工負責的工作範圍..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">性格特質</label>
                  <Input
                    value={newAgent.personality_traits}
                    onChange={(e) => setNewAgent((p) => ({ ...p, personality_traits: e.target.value }))}
                    placeholder="例：果斷、有創意、善於分析"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">溝通風格</label>
                    <Input
                      value={newAgent.personality_comm}
                      onChange={(e) => setNewAgent((p) => ({ ...p, personality_comm: e.target.value }))}
                      placeholder="例：直接了當"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">決策風格</label>
                    <Input
                      value={newAgent.personality_decision}
                      onChange={(e) => setNewAgent((p) => ({ ...p, personality_decision: e.target.value }))}
                      placeholder="例：數據驅動"
                    />
                  </div>
                </div>

                {/* Skills picker */}
                <div>
                  <label className="text-sm font-medium mb-2 block">技能（可多選）</label>
                  <div className="flex gap-2 flex-wrap">
                    {allSkills.map((skill) => (
                      <button
                        key={skill.id}
                        onClick={() => toggleSkill(skill.id)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                          newAgent.skill_ids.includes(skill.id)
                            ? "border-primary bg-primary/20 text-primary"
                            : "border-primary/20 hover:border-primary/40"
                        }`}
                      >
                        {skill.name}
                      </button>
                    ))}
                  </div>
                </div>

                <Button onClick={handleCreate} className="w-full bg-gradient-primary">
                  確認聘請
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold mb-3">團隊成員 ({agents.length})</h2>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">載入中...</p>
            ) : (
              agents.map((agent) => (
                <Card
                  key={agent.id}
                  className={`p-4 cursor-pointer transition-all hover:border-primary/40 ${
                    selectedAgent?.id === agent.id
                      ? "border-primary bg-primary/5"
                      : "bg-gradient-card border-primary/20"
                  }`}
                  onClick={() => fetchAgentDetail(agent.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{agent.avatar_emoji}</span>
                    <div className="flex-1">
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-sm text-primary">{agent.title}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {agent.role === "c-level" ? "🏢 高管" : agent.role === "manager" ? "📋 經理" : "👤 員工"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {agent.skill_count} 技能
                        </span>
                      </div>
                    </div>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        agent.status === "active" ? "bg-green-400" : "bg-gray-400"
                      }`}
                    />
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Agent Detail */}
          <div className="lg:col-span-2">
            {selectedAgent ? (
              <div className="space-y-4">
                {/* Profile Header */}
                <Card className="p-6 bg-gradient-card border-primary/20">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <span className="text-6xl">{selectedAgent.avatar_emoji}</span>
                      <div>
                        <h2 className="text-2xl font-bold">{selectedAgent.name}</h2>
                        <p className="text-primary text-lg">{selectedAgent.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          AI 模型：{selectedAgent.ai_provider.toUpperCase()} ·{" "}
                          {selectedAgent.role === "c-level" ? "C-Level 高管" : selectedAgent.role === "manager" ? "經理" : "員工"}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(selectedAgent.id, selectedAgent.name)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>

                {/* Personality */}
                <Card className="p-5 bg-gradient-card border-primary/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" /> 個性設定
                  </h3>
                  {(() => {
                    const p = (() => {
                      try { return JSON.parse(selectedAgent.personality); } catch { return {}; }
                    })();
                    return (
                      <div className="space-y-2 text-sm">
                        <p><span className="text-muted-foreground">性格特質：</span>{p.traits || "未設定"}</p>
                        <p><span className="text-muted-foreground">溝通風格：</span>{p.communication_style || "未設定"}</p>
                        <p><span className="text-muted-foreground">決策風格：</span>{p.decision_style || "未設定"}</p>
                      </div>
                    );
                  })()}
                  <div className="mt-3 pt-3 border-t border-primary/10">
                    <p className="text-sm"><span className="text-muted-foreground">職責：</span>{selectedAgent.responsibilities || "未設定"}</p>
                  </div>
                </Card>

                {/* Skills */}
                <Card className="p-5 bg-gradient-card border-primary/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> 技能
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {selectedAgent.skills.length > 0 ? (
                      selectedAgent.skills.map((skill) => (
                        <span
                          key={skill.id}
                          className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10"
                        >
                          {skill.name}
                          <span className="ml-1 text-muted-foreground">Lv.{skill.proficiency}</span>
                        </span>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">尚未學習任何技能</p>
                    )}
                  </div>
                </Card>

                {/* Memory */}
                <Card className="p-5 bg-gradient-card border-primary/20">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" /> 記憶紀錄
                  </h3>
                  {selectedAgent.recent_memories.length > 0 ? (
                    <div className="space-y-2">
                      {selectedAgent.recent_memories.map((mem) => (
                        <div
                          key={mem.id}
                          className="text-sm p-3 rounded-lg bg-background/50 border border-primary/10"
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                              {mem.memory_type === "learning" ? "學習" : mem.memory_type === "decision" ? "決策" : mem.memory_type === "interaction" ? "互動" : "觀察"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(mem.created_at).toLocaleDateString("zh-TW")}
                            </span>
                          </div>
                          <p className="mt-1">{mem.content}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">尚無記憶紀錄</p>
                  )}
                </Card>

                {/* Work Logs */}
                {selectedAgent.recent_logs.length > 0 && (
                  <Card className="p-5 bg-gradient-card border-primary/20">
                    <h3 className="font-semibold mb-3">工作日誌</h3>
                    <div className="space-y-2">
                      {selectedAgent.recent_logs.map((log) => (
                        <div key={log.id} className="text-sm flex gap-3 items-start">
                          <span className="text-xs text-muted-foreground whitespace-nowrap mt-0.5">
                            {new Date(log.created_at).toLocaleDateString("zh-TW")}
                          </span>
                          <p>{log.content}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="p-12 bg-gradient-card border-primary/20 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">選擇一位員工查看詳細資料</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAgents;
