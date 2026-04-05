import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AmoebaLayout from "@/components/amoeba/AmoebaLayout";
import { useAmoebaStore } from "@/hooks/use-amoeba-store";
import {
  ScrollText,
  Search,
  User,
  DollarSign,
  Building2,
  Users,
  Target,
  ArrowLeftRight,
  Wallet,
  Settings,
  Filter,
} from "lucide-react";

const ACTION_ICONS: Record<string, React.ReactNode> = {
  revenue: <DollarSign className="w-4 h-4 text-green-400" />,
  expense: <DollarSign className="w-4 h-4 text-red-400" />,
  unit: <Building2 className="w-4 h-4 text-blue-400" />,
  member: <Users className="w-4 h-4 text-purple-400" />,
  goal: <Target className="w-4 h-4 text-yellow-400" />,
  budget: <Wallet className="w-4 h-4 text-orange-400" />,
  transaction: <ArrowLeftRight className="w-4 h-4 text-cyan-400" />,
  collaborator: <Users className="w-4 h-4 text-pink-400" />,
  organization: <Settings className="w-4 h-4 text-primary" />,
};

const TARGET_LABELS: Record<string, string> = {
  revenue: "營收",
  expense: "費用",
  unit: "單位",
  member: "成員",
  goal: "目標",
  budget: "預算",
  transaction: "交易",
  collaborator: "協作",
  organization: "組織",
};

const AmoebaActivity = () => {
  const store = useAmoebaStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const filteredLogs = useMemo(() => {
    let logs = store.activityLog;

    if (filterType !== "all") {
      logs = logs.filter((l) => l.target_type === filterType);
    }

    if (filterUser !== "all") {
      logs = logs.filter((l) => l.user_id === filterUser);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      logs = logs.filter(
        (l) =>
          l.action.toLowerCase().includes(q) ||
          l.target_name.toLowerCase().includes(q) ||
          l.user_name.toLowerCase().includes(q) ||
          (l.details || "").toLowerCase().includes(q)
      );
    }

    return logs;
  }, [store.activityLog, filterType, filterUser, searchQuery]);

  const totalPages = Math.ceil(filteredLogs.length / perPage);
  const pagedLogs = filteredLogs.slice((page - 1) * perPage, page * perPage);

  // Unique users from logs
  const logUsers = useMemo(() => {
    const map = new Map<string, string>();
    store.activityLog.forEach((l) => map.set(l.user_id, l.user_name));
    return Array.from(map.entries());
  }, [store.activityLog]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDay = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "剛剛";
    if (diffMin < 60) return `${diffMin} 分鐘前`;
    if (diffHr < 24) return `${diffHr} 小時前`;
    if (diffDay < 7) return `${diffDay} 天前`;
    return d.toLocaleDateString("zh-TW", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AmoebaLayout title="操作日誌" subtitle="追蹤所有團隊成員的操作記錄">
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-6">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="搜尋操作記錄..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-9"
            />
          </div>
        </div>
        <div>
          <Select
            value={filterType}
            onValueChange={(v) => {
              setFilterType(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-36">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部類型</SelectItem>
              {Object.entries(TARGET_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {logUsers.length > 1 && (
          <div>
            <Select
              value={filterUser}
              onValueChange={(v) => {
                setFilterUser(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-40">
                <User className="w-3 h-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部使用者</SelectItem>
                {logUsers.map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-6 text-sm text-muted-foreground">
        <span>共 {filteredLogs.length} 筆記錄</span>
        {filteredLogs.length !== store.activityLog.length && (
          <span>（篩選自 {store.activityLog.length} 筆）</span>
        )}
      </div>

      {/* Log List */}
      {pagedLogs.length === 0 ? (
        <Card className="p-12 bg-gradient-card backdrop-blur-sm border-primary/20 text-center">
          <ScrollText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">
            {store.activityLog.length === 0 ? "尚無操作記錄" : "無符合條件的記錄"}
          </h3>
          <p className="text-muted-foreground">
            {store.activityLog.length === 0
              ? "當您或團隊成員執行操作時，系統會自動記錄於此"
              : "請調整篩選條件後重試"}
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {pagedLogs.map((log) => (
            <Card
              key={log.id}
              className="p-4 bg-gradient-card backdrop-blur-sm border-primary/20 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-background/50 flex items-center justify-center shrink-0 mt-0.5">
                  {ACTION_ICONS[log.target_type] || <ScrollText className="w-4 h-4 text-muted-foreground" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{log.user_name}</span>
                    <span className="text-sm text-muted-foreground">{log.action}</span>
                    <Badge variant="outline" className="text-xs">
                      {TARGET_LABELS[log.target_type] || log.target_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-foreground mt-0.5">{log.target_name}</p>
                  {log.details && (
                    <p className="text-xs text-muted-foreground mt-0.5">{log.details}</p>
                  )}
                </div>

                <span className="text-xs text-muted-foreground shrink-0 mt-1">
                  {formatDate(log.created_at)}
                </span>
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                上一頁
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {page} / {totalPages} 頁
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                下一頁
              </Button>
            </div>
          )}
        </div>
      )}
    </AmoebaLayout>
  );
};

export default AmoebaActivity;
