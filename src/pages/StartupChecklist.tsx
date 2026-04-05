import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Brain,
  Search,
  Building2,
  DollarSign,
  Palette,
  Lightbulb,
  Users,
  Monitor,
  Target,
  Rocket,
  ArrowLeft,
  CheckCircle2,
  Circle,
  Calendar,
  Trophy,
  Star,
  Book,
  Video,
  Wrench,
  FileText,
  Layout,
  ClipboardCopy,
  RotateCcw,
  CalendarDays,
  TrendingUp,
  Clock,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Globe,
  Server,
  Mail,
  Shield,
  PenTool,
  Megaphone,
  HardDrive,
  ExternalLink,
  BadgeCheck,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  checklistCategories,
  yearPlan,
  nssServices,
  nssPhaseMapping,
  type ChecklistCategory,
  type ChecklistItem,
  type ChecklistResource,
  type WeekPlan,
  type DayTask,
  type NssServiceCategory,
  type NssServiceItem,
} from "@/data/startupChecklist";

// ── Icon mapping ──────────────────────────────────────────────────────────────
const iconMap: Record<string, LucideIcon> = {
  Brain,
  Search,
  Building2,
  DollarSign,
  Palette,
  Lightbulb,
  Users,
  Monitor,
  Target,
  Rocket,
  Globe,
  Server,
  Mail,
  Shield,
  PenTool,
  Megaphone,
  HardDrive,
};

const resourceTypeIcon: Record<string, LucideIcon> = {
  article: FileText,
  video: Video,
  tool: Wrench,
  template: Layout,
  book: Book,
};

const resourceTypeLabel: Record<string, string> = {
  article: "文章",
  video: "影片",
  tool: "工具",
  template: "模板",
  book: "書籍",
};

// ── LocalStorage keys ─────────────────────────────────────────────────────────
const LS_ITEMS = "startup_checklist_items";
const LS_DAYS = "startup_checklist_days";
const LS_START = "startup_checklist_start_date";

type ItemState = Record<string, { completed: boolean; completedAt?: string }>;
type DayState = Record<number, { completed: boolean; completedAt?: string }>;

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

// ── Helper: day of year from start date ───────────────────────────────────────
function getCurrentDay(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diff = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(1, diff + 1);
}

function getCurrentWeek(day: number): number {
  return Math.min(52, Math.ceil(day / 7));
}

// ── Main Component ────────────────────────────────────────────────────────────
const StartupChecklist = () => {
  const navigate = useNavigate();

  // Auth check
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      navigate("/auth");
    }
  }, [navigate]);

  // State
  const [itemState, setItemState] = useState<ItemState>(() =>
    loadJSON(LS_ITEMS, {})
  );
  const [dayState, setDayState] = useState<DayState>(() =>
    loadJSON(LS_DAYS, {})
  );
  const [startDate, setStartDate] = useState<string>(() => {
    const saved = localStorage.getItem(LS_START);
    if (saved) return saved;
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(LS_START, today);
    return today;
  });
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    checklistCategories[0]?.id ?? ""
  );
  const [selectedWeek, setSelectedWeek] = useState<number>(() =>
    getCurrentWeek(getCurrentDay(startDate))
  );
  const [activeTab, setActiveTab] = useState("overview");
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [dateDialogOpen, setDateDialogOpen] = useState(false);
  const [tempDate, setTempDate] = useState(startDate);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(LS_ITEMS, JSON.stringify(itemState));
  }, [itemState]);
  useEffect(() => {
    localStorage.setItem(LS_DAYS, JSON.stringify(dayState));
  }, [dayState]);
  useEffect(() => {
    localStorage.setItem(LS_START, startDate);
  }, [startDate]);

  // Derived
  const currentDay = useMemo(() => getCurrentDay(startDate), [startDate]);
  const currentWeek = useMemo(() => getCurrentWeek(currentDay), [currentDay]);

  const allItems = useMemo(
    () => checklistCategories.flatMap((c) => c.items),
    []
  );
  const totalItems = allItems.length;
  const completedItems = useMemo(
    () => allItems.filter((i) => itemState[i.id]?.completed).length,
    [allItems, itemState]
  );
  const overallPercent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const allDays = useMemo(() => yearPlan.flatMap((w) => w.days), []);
  const totalDays = allDays.length;
  const completedDays = useMemo(
    () => allDays.filter((d) => dayState[d.day]?.completed).length,
    [allDays, dayState]
  );

  const todayTask = useMemo(
    () => allDays.find((d) => d.day === currentDay) ?? null,
    [allDays, currentDay]
  );

  const nextMilestone = useMemo(() => {
    return allDays.find(
      (d) => d.milestone && d.day >= currentDay && !dayState[d.day]?.completed
    );
  }, [allDays, currentDay, dayState]);

  // Category stats
  const categoryStats = useMemo(() => {
    const map: Record<string, { total: number; completed: number }> = {};
    checklistCategories.forEach((cat) => {
      const total = cat.items.length;
      const completed = cat.items.filter(
        (i) => itemState[i.id]?.completed
      ).length;
      map[cat.id] = { total, completed };
    });
    return map;
  }, [itemState]);

  // Handlers
  const toggleItem = useCallback((id: string) => {
    setItemState((prev) => {
      const current = prev[id];
      if (current?.completed) {
        return { ...prev, [id]: { completed: false } };
      }
      return {
        ...prev,
        [id]: { completed: true, completedAt: new Date().toISOString() },
      };
    });
  }, []);

  const toggleDay = useCallback((day: number) => {
    setDayState((prev) => {
      const current = prev[day];
      if (current?.completed) {
        return { ...prev, [day]: { completed: false } };
      }
      return {
        ...prev,
        [day]: { completed: true, completedAt: new Date().toISOString() },
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setItemState({});
    setDayState({});
    localStorage.removeItem(LS_ITEMS);
    localStorage.removeItem(LS_DAYS);
    setResetDialogOpen(false);
  }, []);

  const changeStartDate = useCallback(() => {
    setStartDate(tempDate);
    setSelectedWeek(getCurrentWeek(getCurrentDay(tempDate)));
    setDateDialogOpen(false);
  }, [tempDate]);

  const exportProgress = useCallback(() => {
    const text = [
      "創業成功 365 天行動清單 - 進度報告",
      `開始日期：${startDate}`,
      `目前天數：第 ${currentDay} 天`,
      `清單完成：${completedItems} / ${totalItems} (${overallPercent}%)`,
      `天數完成：${completedDays} / ${totalDays}`,
      "",
      "分類進度：",
      ...checklistCategories.map((cat) => {
        const s = categoryStats[cat.id];
        const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0;
        return `  ${cat.title}：${s.completed}/${s.total} (${pct}%)`;
      }),
    ].join("\n");
    navigator.clipboard.writeText(text);
  }, [startDate, currentDay, completedItems, totalItems, overallPercent, completedDays, totalDays, categoryStats]);

  const selectedCategory = useMemo(
    () => checklistCategories.find((c) => c.id === selectedCategoryId) ?? checklistCategories[0],
    [selectedCategoryId]
  );

  const selectedWeekPlan = useMemo(
    () => yearPlan.find((w) => w.week === selectedWeek) ?? yearPlan[0],
    [selectedWeek]
  );

  // ── Render helpers ────────────────────────────────────────────────────────
  const CategoryIcon = ({ iconName, className }: { iconName: string; className?: string }) => {
    const Icon = iconMap[iconName] ?? Rocket;
    return <Icon className={className} />;
  };

  const ResourceIcon = ({ type, className }: { type: string; className?: string }) => {
    const Icon = resourceTypeIcon[type] ?? FileText;
    return <Icon className={className} />;
  };

  // ── SVG progress ring ─────────────────────────────────────────────────────
  const ProgressRing = ({ percent, size = 160 }: { percent: number; size?: number }) => {
    const stroke = 10;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;
    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/30"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#progressGradient)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-foreground">{percent}%</span>
          <span className="text-xs text-muted-foreground">完成進度</span>
        </div>
      </div>
    );
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                創業成功 365 天行動清單
              </h1>
              <p className="text-sm text-muted-foreground">
                系統化的創業指南，從構思到成長的完整路線圖
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportProgress}>
              <ClipboardCopy className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">匯出進度</span>
            </Button>
            <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => setTempDate(startDate)}>
                  <CalendarDays className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">設定開始日期</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>設定開始日期</DialogTitle>
                  <DialogDescription>
                    選擇你的創業旅程開始日期，系統會根據此日期計算目前進度。
                  </DialogDescription>
                </DialogHeader>
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={changeStartDate}>確認</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <RotateCcw className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">重置進度</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>確認重置進度</DialogTitle>
                  <DialogDescription>
                    此操作將清除所有已完成的項目和天數記錄，無法復原。確定要繼續嗎？
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setResetDialogOpen(false)}>
                    取消
                  </Button>
                  <Button variant="destructive" onClick={resetProgress}>
                    確認重置
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 w-full sm:w-auto">
            <TabsTrigger value="overview" className="flex-1 sm:flex-none">
              總覽儀表板
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 sm:flex-none">
              分類清單
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex-1 sm:flex-none">
              365天計畫
            </TabsTrigger>
            <TabsTrigger value="nss" className="flex-1 sm:flex-none">
              戰國策服務
            </TabsTrigger>
          </TabsList>

          {/* ───────────────── Tab 1: Overview ───────────────── */}
          <TabsContent value="overview" className="space-y-6">
            {/* Top stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Progress ring */}
              <Card className="flex items-center justify-center py-8 bg-card/50 border-border/40">
                <ProgressRing percent={overallPercent} />
              </Card>

              {/* Stats grid */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <Card className="bg-card/50 border-border/40">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <CheckCircle2 className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">已完成項目</p>
                      <p className="text-2xl font-bold">{completedItems} <span className="text-sm text-muted-foreground font-normal">/ {totalItems}</span></p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/40">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10">
                      <Calendar className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">進行中天數</p>
                      <p className="text-2xl font-bold">第 {currentDay} 天</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/40">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/10">
                      <TrendingUp className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">總任務數</p>
                      <p className="text-2xl font-bold">{totalDays}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/50 border-border/40">
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/10">
                      <Trophy className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">下一個里程碑</p>
                      <p className="text-sm font-semibold truncate">
                        {nextMilestone ? `第${nextMilestone.day}天 - ${nextMilestone.milestone}` : "已全部完成！"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Today's task */}
            {todayTask && (
              <Card className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border-purple-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    今日任務 — 第 {todayTask.day} 天
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-lg">{todayTask.title}</p>
                  <p className="text-sm text-muted-foreground">{todayTask.description}</p>
                  <div className="flex items-center gap-2 pt-1">
                    <Badge variant="secondary">{checklistCategories.find(c => c.id === todayTask.categoryId)?.title ?? todayTask.categoryId}</Badge>
                    {todayTask.milestone && (
                      <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30">
                        <Star className="h-3 w-3 mr-1" />
                        {todayTask.milestone}
                      </Badge>
                    )}
                    <Button
                      variant={dayState[todayTask.day]?.completed ? "secondary" : "default"}
                      size="sm"
                      className="ml-auto"
                      onClick={() => toggleDay(todayTask.day)}
                    >
                      {dayState[todayTask.day]?.completed ? "已完成" : "標記完成"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Category progress grid */}
            <div>
              <h2 className="text-lg font-semibold mb-4">分類進度</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {checklistCategories.map((cat) => {
                  const stats = categoryStats[cat.id] ?? { total: 0, completed: 0 };
                  const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                  return (
                    <Card
                      key={cat.id}
                      className="bg-card/50 border-border/40 hover:border-purple-500/40 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedCategoryId(cat.id);
                        setActiveTab("categories");
                      }}
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <CategoryIcon iconName={cat.icon} className={`h-5 w-5 ${cat.color}`} />
                          <span className="font-medium text-sm truncate">{cat.title}</span>
                        </div>
                        <Progress value={pct} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{stats.completed}/{stats.total} 項目</span>
                          <span>{pct}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ───────────────── Tab 2: Categories ───────────────── */}
          <TabsContent value="categories">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Sidebar */}
              <div className="md:w-64 flex-shrink-0">
                <ScrollArea className="md:h-[calc(100vh-220px)]">
                  <div className="space-y-1 pr-2">
                    {checklistCategories.map((cat) => {
                      const stats = categoryStats[cat.id] ?? { total: 0, completed: 0 };
                      const pct = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
                      const isActive = cat.id === selectedCategoryId;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                            isActive
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : "hover:bg-muted/50 text-muted-foreground"
                          }`}
                        >
                          <CategoryIcon iconName={cat.icon} className={`h-4 w-4 flex-shrink-0 ${cat.color}`} />
                          <span className="truncate flex-1">{cat.title}</span>
                          <span className="text-xs opacity-70">{pct}%</span>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {selectedCategory && (
                  <div className="space-y-4">
                    {/* Category header */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CategoryIcon
                          iconName={selectedCategory.icon}
                          className={`h-6 w-6 ${selectedCategory.color}`}
                        />
                        <h2 className="text-xl font-bold">{selectedCategory.title}</h2>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {selectedCategory.description}
                      </p>
                      <div className="flex items-center gap-3">
                        <Progress
                          value={
                            categoryStats[selectedCategory.id]?.total > 0
                              ? Math.round(
                                  (categoryStats[selectedCategory.id].completed /
                                    categoryStats[selectedCategory.id].total) *
                                    100
                                )
                              : 0
                          }
                          className="h-2 flex-1"
                        />
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          {categoryStats[selectedCategory.id]?.completed ?? 0}/
                          {categoryStats[selectedCategory.id]?.total ?? 0} 已完成
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <Accordion type="multiple" className="space-y-2">
                      {selectedCategory.items.map((item) => {
                        const done = itemState[item.id]?.completed ?? false;
                        const doneAt = itemState[item.id]?.completedAt;
                        return (
                          <AccordionItem
                            key={item.id}
                            value={item.id}
                            className="border border-border/40 rounded-lg bg-card/50 px-4"
                          >
                            <div className="flex items-center gap-3 py-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleItem(item.id);
                                }}
                                className="flex-shrink-0"
                              >
                                {done ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground hover:text-purple-400 transition-colors" />
                                )}
                              </button>
                              <AccordionTrigger className="flex-1 hover:no-underline py-0">
                                <div className="text-left">
                                  <span className={`font-medium ${done ? "line-through text-muted-foreground" : ""}`}>
                                    {item.title}
                                  </span>
                                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                    {item.description}
                                  </p>
                                </div>
                              </AccordionTrigger>
                              {done && doneAt && (
                                <span className="text-xs text-muted-foreground flex-shrink-0 hidden sm:block">
                                  {new Date(doneAt).toLocaleDateString("zh-TW")}
                                </span>
                              )}
                            </div>
                            <AccordionContent className="pb-4 pl-8 space-y-4">
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>

                              {/* Resources */}
                              {item.resources.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">推薦資源</h4>
                                  <div className="space-y-2">
                                    {item.resources.map((res, idx) => (
                                      <div
                                        key={idx}
                                        className="flex items-start gap-2 text-sm"
                                      >
                                        <ResourceIcon
                                          type={res.type}
                                          className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0"
                                        />
                                        <div>
                                          {res.url ? (
                                            <a
                                              href={res.url}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-purple-400 hover:underline"
                                            >
                                              {res.title}
                                            </a>
                                          ) : (
                                            <span>{res.title}</span>
                                          )}
                                          <Badge variant="outline" className="ml-2 text-xs">
                                            {resourceTypeLabel[res.type] ?? res.type}
                                          </Badge>
                                          {res.description && (
                                            <p className="text-xs text-muted-foreground">
                                              {res.description}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Tools */}
                              {item.tools.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold mb-2">推薦工具</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {item.tools.map((tool, idx) => (
                                      <Badge key={idx} variant="secondary">
                                        <Wrench className="h-3 w-3 mr-1" />
                                        {tool}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Tips */}
                              {item.tips && (
                                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                                  <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                                    <Lightbulb className="h-4 w-4 text-yellow-400" />
                                    小提示
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {item.tips}
                                  </p>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* ───────────────── Tab 3: 365-Day Plan ───────────────── */}
          <TabsContent value="plan" className="space-y-6">
            {/* Progress timeline */}
            <Card className="bg-card/50 border-border/40">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">年度進度</span>
                  <span className="text-xs text-muted-foreground">
                    第 {currentDay} 天 / 365 天
                  </span>
                </div>
                <div className="relative">
                  <Progress value={(currentDay / 365) * 100} className="h-3" />
                  <div className="flex justify-between mt-1">
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthDay = Math.round(((i + 1) / 12) * 365);
                      return (
                        <span key={i} className="text-[10px] text-muted-foreground">
                          {i + 1}月
                        </span>
                      );
                    })}
                  </div>
                </div>
                {/* Milestone markers */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {allDays
                    .filter((d) => d.milestone)
                    .slice(0, 6)
                    .map((d) => (
                      <Badge
                        key={d.day}
                        variant={dayState[d.day]?.completed ? "default" : "outline"}
                        className={`text-xs ${
                          dayState[d.day]?.completed
                            ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"
                            : d.day <= currentDay
                            ? "border-yellow-500/30 text-yellow-400/70"
                            : ""
                        }`}
                      >
                        <Star className="h-3 w-3 mr-1" />
                        第{d.day}天: {d.milestone}
                      </Badge>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Week selector */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
                disabled={selectedWeek <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <ScrollArea className="flex-1">
                <div className="flex gap-1 pb-2">
                  {yearPlan.map((wp) => (
                    <button
                      key={wp.week}
                      onClick={() => setSelectedWeek(wp.week)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-md text-xs transition-colors ${
                        wp.week === selectedWeek
                          ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                          : wp.week === currentWeek
                          ? "bg-indigo-500/10 text-indigo-300 border border-indigo-500/20"
                          : "hover:bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      W{wp.week}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedWeek((w) => Math.min(52, w + 1))}
                disabled={selectedWeek >= 52}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedWeek(currentWeek)}
              >
                <Clock className="h-4 w-4 mr-1" />
                今天
              </Button>
            </div>

            {/* Week header */}
            {selectedWeekPlan && (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">
                  第 {selectedWeekPlan.week} 週
                </h2>
                <Badge variant="secondary">{selectedWeekPlan.theme}</Badge>
              </div>
            )}

            {/* Day cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {selectedWeekPlan?.days.map((day) => {
                const done = dayState[day.day]?.completed ?? false;
                const isToday = day.day === currentDay;
                const cat = checklistCategories.find((c) => c.id === day.categoryId);
                return (
                  <Card
                    key={day.day}
                    className={`bg-card/50 border-border/40 transition-all ${
                      isToday ? "ring-2 ring-purple-500/50 border-purple-500/30" : ""
                    } ${done ? "opacity-75" : ""}`}
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${isToday ? "text-purple-400" : "text-muted-foreground"}`}>
                            第{day.day}天
                          </span>
                          {isToday && (
                            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                              今天
                            </Badge>
                          )}
                        </div>
                        <button onClick={() => toggleDay(day.day)}>
                          {done ? (
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                          ) : (
                            <Circle className="h-5 w-5 text-muted-foreground hover:text-purple-400 transition-colors" />
                          )}
                        </button>
                      </div>
                      <div>
                        <p className={`font-medium text-sm ${done ? "line-through text-muted-foreground" : ""}`}>
                          {day.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {day.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {cat && (
                          <Badge variant="outline" className="text-xs">
                            <CategoryIcon iconName={cat.icon} className={`h-3 w-3 mr-1 ${cat.color}`} />
                            {cat.title}
                          </Badge>
                        )}
                        {day.milestone && (
                          <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-500/30 text-xs">
                            <Trophy className="h-3 w-3 mr-1" />
                            {day.milestone}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ───────────────── Tab 4: NSS Services ───────────────── */}
          <TabsContent value="nss" className="space-y-6">
            {/* NSS Header */}
            <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/20">
                    <Zap className="h-8 w-8 text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                      戰國策創業服務
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      戰國策集團提供一站式數位服務，涵蓋網域註冊、主機代管、網站設計、資安防護到數位行銷。
                      以下服務已按照創業不同階段的需求分類，幫助你在正確的時間選擇正確的服務。
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="secondary" className="text-xs">
                        <Globe className="h-3 w-3 mr-1" />
                        網域註冊
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Server className="h-3 w-3 mr-1" />
                        主機代管
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="h-3 w-3 mr-1" />
                        資安防護
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <PenTool className="h-3 w-3 mr-1" />
                        網站設計
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Megaphone className="h-3 w-3 mr-1" />
                        數位行銷
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phase Recommendation */}
            {(() => {
              const currentPhaseServices = checklistCategories
                .filter((cat) => {
                  const stats = categoryStats[cat.id];
                  return stats && stats.completed < stats.total;
                })
                .flatMap((cat) => nssPhaseMapping[cat.id] ?? [])
                .filter((v, i, a) => a.indexOf(v) === i);
              const recommendedServices = nssServices.filter((s) =>
                currentPhaseServices.includes(s.id)
              );
              if (recommendedServices.length === 0) return null;
              return (
                <Card className="bg-yellow-500/5 border-yellow-500/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BadgeCheck className="h-5 w-5 text-yellow-400" />
                      根據你目前的創業進度推薦
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {recommendedServices.map((svc) => (
                        <Badge
                          key={svc.id}
                          className="bg-yellow-500/10 text-yellow-300 border-yellow-500/20 cursor-pointer hover:bg-yellow-500/20 transition-colors"
                        >
                          <CategoryIcon iconName={svc.icon} className="h-3 w-3 mr-1" />
                          {svc.title}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Service Categories */}
            <div className="space-y-6">
              {nssServices.map((category) => (
                <Card key={category.id} className="bg-card/50 border-border/40 overflow-hidden">
                  {/* Category Header */}
                  <div className="px-6 py-4 border-b border-border/40 bg-card/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-indigo-500/10`}>
                          <CategoryIcon iconName={category.icon} className={`h-5 w-5 ${category.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{category.title}</h3>
                          <p className="text-xs text-muted-foreground">{category.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs hidden sm:flex">
                        {category.phaseTag}
                      </Badge>
                    </div>
                  </div>

                  {/* Service Items */}
                  <CardContent className="p-0">
                    <Accordion type="multiple">
                      {category.services.map((service) => (
                        <AccordionItem
                          key={service.id}
                          value={service.id}
                          className="border-b border-border/30 last:border-0"
                        >
                          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/10">
                            <div className="text-left">
                              <span className="font-medium">{service.title}</span>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1 pr-4">
                                {service.description}
                              </p>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-6 pb-5 space-y-4">
                            <p className="text-sm text-muted-foreground">
                              {service.description}
                            </p>

                            {/* Features */}
                            <div>
                              <h4 className="text-sm font-semibold mb-2">服務特色</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {service.features.map((feature, idx) => (
                                  <div key={idx} className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                                    <span className="text-muted-foreground">{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Recommendation */}
                            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3">
                              <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                                <BadgeCheck className="h-4 w-4 text-indigo-400" />
                                推薦對象
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {service.recommended}
                              </p>
                            </div>

                            {/* Tips */}
                            <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3">
                              <h4 className="text-sm font-semibold mb-1 flex items-center gap-1">
                                <Lightbulb className="h-4 w-4 text-yellow-400" />
                                創業小提示
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {service.tips}
                              </p>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StartupChecklist;
