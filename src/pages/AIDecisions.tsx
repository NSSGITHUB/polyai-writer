import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowLeft,
  ClipboardCheck,
  ThumbsUp,
  ThumbsDown,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_BASE_URL } from "@/lib/api";

interface Decision {
  id: number;
  meeting_id: number | null;
  meeting_title: string | null;
  title: string;
  recommendation: string;
  pros: string;
  cons: string;
  priority: string;
  status: string;
  created_at: string;
}

const AIDecisions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const getUserId = () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) { navigate("/auth"); return ""; }
    try { return JSON.parse(userStr).id; } catch { navigate("/auth"); return ""; }
  };

  const fetchDecisions = async () => {
    const userId = getUserId();
    if (!userId) return;
    setIsLoading(true);
    try {
      const url = `${API_BASE_URL}/ai-company/decisions.php?user_id=${userId}${filter !== "all" ? `&status=${filter}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setDecisions(data.decisions || []);
    } catch (error) {
      console.error("Failed to fetch decisions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
  }, [filter]);

  const updateDecision = async (decisionId: number, status: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/ai-company/decisions.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision_id: decisionId, status }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: status === "approved" ? "已採納" : status === "rejected" ? "已否決" : "已延後",
        });
        fetchDecisions();
      }
    } catch (error: any) {
      toast({ title: "更新失敗", description: error.message, variant: "destructive" });
    }
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      critical: "bg-red-500/20 text-red-400",
      high: "bg-orange-500/20 text-orange-400",
      medium: "bg-yellow-500/20 text-yellow-400",
      low: "bg-green-500/20 text-green-400",
    };
    const labels: Record<string, string> = {
      critical: "緊急",
      high: "高",
      medium: "中",
      low: "低",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[priority] || styles.medium}`}>
        {labels[priority] || priority}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-gray-500/20 text-gray-400",
      approved: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
      deferred: "bg-yellow-500/20 text-yellow-400",
    };
    const labels: Record<string, string> = {
      pending: "待審核",
      approved: "已採納",
      rejected: "已否決",
      deferred: "已延後",
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

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
              <ClipboardCheck className="w-8 h-8 text-primary" />
              決策建議
            </h1>
            <p className="text-muted-foreground">AI 團隊會議產生的決策建議，供你審核</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all", label: "全部" },
            { key: "pending", label: "待審核" },
            { key: "approved", label: "已採納" },
            { key: "rejected", label: "已否決" },
            { key: "deferred", label: "已延後" },
          ].map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className={filter === f.key ? "bg-gradient-primary" : ""}
            >
              {f.label}
            </Button>
          ))}
        </div>

        {/* Decisions */}
        {isLoading ? (
          <p className="text-center text-muted-foreground py-12">載入中...</p>
        ) : decisions.length === 0 ? (
          <Card className="p-12 bg-gradient-card border-primary/20 text-center">
            <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-3">
              {filter === "all" ? "目前沒有任何決策建議" : `沒有${filter === "pending" ? "待審核" : filter === "approved" ? "已採納" : filter === "rejected" ? "已否決" : "已延後"}的決策`}
            </p>
            <Button variant="outline" onClick={() => navigate("/ai-company/meeting")}>
              召開會議產生決策
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {decisions.map((dec) => {
              let pros: string[] = [];
              let cons: string[] = [];
              try { pros = JSON.parse(dec.pros); } catch { /* empty */ }
              try { cons = JSON.parse(dec.cons); } catch { /* empty */ }

              return (
                <Card key={dec.id} className="p-6 bg-gradient-card border-primary/20">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-bold">{dec.title}</h3>
                      {dec.meeting_title && (
                        <p className="text-xs text-muted-foreground mt-1">
                          來自會議：{dec.meeting_title}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {getPriorityBadge(dec.priority)}
                      {getStatusBadge(dec.status)}
                    </div>
                  </div>

                  <div className="text-sm whitespace-pre-wrap mb-4 leading-relaxed">
                    {dec.recommendation}
                  </div>

                  {(pros.length > 0 || cons.length > 0) && (
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {pros.length > 0 && (
                        <div className="p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <p className="text-xs font-semibold text-green-400 mb-1">優點</p>
                          <ul className="text-xs space-y-1">
                            {pros.map((p, i) => (
                              <li key={i}>• {p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {cons.length > 0 && (
                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                          <p className="text-xs font-semibold text-red-400 mb-1">風險</p>
                          <ul className="text-xs space-y-1">
                            {cons.map((c, i) => (
                              <li key={i}>• {c}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {dec.status === "pending" && (
                    <div className="flex gap-2 pt-3 border-t border-primary/10">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateDecision(dec.id, "approved")}
                      >
                        <ThumbsUp className="mr-1 w-3 h-3" /> 採納
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={() => updateDecision(dec.id, "rejected")}
                      >
                        <ThumbsDown className="mr-1 w-3 h-3" /> 否決
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateDecision(dec.id, "deferred")}
                      >
                        <Clock className="mr-1 w-3 h-3" /> 延後
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground mt-3">
                    {new Date(dec.created_at).toLocaleString("zh-TW")}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AIDecisions;
