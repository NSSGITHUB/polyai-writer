import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Trash2 } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, isSameMonth } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

interface ScheduledPost {
  id: string;
  created_at: string;
  scheduled_time: string;
  status: string;
  error_message: string | null;
  article_id: number;
  site_id: string;
  wordpress_post_id: number | null;
  site_name: string;
  site_url: string;
}

interface ScheduleCalendarProps {
  posts: ScheduledPost[];
  articleTitles: Record<number, string>;
  onDelete: (postId: string) => void;
}

const statusColors: Record<string, string> = {
  scheduled: "bg-blue-500",
  sending: "bg-yellow-500",
  success: "bg-green-500",
  failed: "bg-red-500",
  pending: "bg-gray-400",
};

const statusLabels: Record<string, string> = {
  scheduled: "已排程",
  sending: "發送中",
  success: "成功",
  failed: "失敗",
  pending: "待處理",
};

export function ScheduleCalendar({ posts, articleTitles, onDelete }: ScheduleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 計算月份開始的星期幾 (0 = 週日)
  const startDayOfWeek = monthStart.getDay();
  
  // 前面需要填充的空白天數
  const paddingDays = Array.from({ length: startDayOfWeek }, (_, i) => i);

  // 按日期分組的排程
  const postsByDate = useMemo(() => {
    const grouped: Record<string, ScheduledPost[]> = {};
    posts.forEach((post) => {
      if (post.scheduled_time) {
        const date = toZonedTime(new Date(post.scheduled_time), 'Asia/Taipei');
        const dateKey = format(date, 'yyyy-MM-dd');
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(post);
      }
    });
    return grouped;
  }, [posts]);

  const getPostsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return postsByDate[dateKey] || [];
  };

  const goToPrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const handleDateClick = (date: Date) => {
    const dayPosts = getPostsForDate(date);
    if (dayPosts.length > 0) {
      setSelectedDate(date);
      setDialogOpen(true);
    }
  };

  const selectedDatePosts = selectedDate ? getPostsForDate(selectedDate) : [];

  // 計算月份統計
  const monthStats = useMemo(() => {
    let scheduled = 0;
    let success = 0;
    let failed = 0;

    Object.entries(postsByDate).forEach(([dateKey, datePosts]) => {
      const date = new Date(dateKey);
      if (isSameMonth(date, currentMonth)) {
        datePosts.forEach((post) => {
          if (post.status === 'scheduled') scheduled++;
          else if (post.status === 'success') success++;
          else if (post.status === 'failed') failed++;
        });
      }
    });

    return { scheduled, success, failed, total: scheduled + success + failed };
  }, [postsByDate, currentMonth]);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* 月份統計卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold">{monthStats.total}</div>
              <p className="text-xs text-muted-foreground">本月總排程</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-blue-500">{monthStats.scheduled}</div>
              <p className="text-xs text-muted-foreground">待發布</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-green-500">{monthStats.success}</div>
              <p className="text-xs text-muted-foreground">已發布</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-2xl font-bold text-red-500">{monthStats.failed}</div>
              <p className="text-xs text-muted-foreground">發布失敗</p>
            </CardContent>
          </Card>
        </div>

        {/* 行事曆 */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                {format(currentMonth, 'yyyy年 M月', { locale: zhTW })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={goToToday}>
                  今天
                </Button>
                <Button variant="outline" size="icon" onClick={goToPrevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* 星期標題 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 日期網格 */}
            <div className="grid grid-cols-7 gap-1">
              {/* 填充空白 */}
              {paddingDays.map((i) => (
                <div key={`padding-${i}`} className="h-24 md:h-28" />
              ))}

              {/* 日期格子 */}
              {daysInMonth.map((day) => {
                const dayPosts = getPostsForDate(day);
                const hasScheduled = dayPosts.some(p => p.status === 'scheduled');
                const hasSuccess = dayPosts.some(p => p.status === 'success');
                const hasFailed = dayPosts.some(p => p.status === 'failed');

                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => handleDateClick(day)}
                    className={`
                      h-24 md:h-28 p-1 border rounded-lg transition-colors
                      ${isToday(day) ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                      ${dayPosts.length > 0 ? 'cursor-pointer hover:bg-accent' : ''}
                    `}
                  >
                    <div className={`
                      text-sm font-medium mb-1 flex items-center justify-center w-6 h-6 rounded-full
                      ${isToday(day) ? 'bg-primary text-primary-foreground' : ''}
                    `}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* 文章預覽 */}
                    <div className="space-y-0.5 overflow-hidden">
                      {dayPosts.slice(0, 2).map((post) => (
                        <Tooltip key={post.id}>
                          <TooltipTrigger asChild>
                            <div
                              className={`
                                text-xs px-1 py-0.5 rounded truncate text-white
                                ${statusColors[post.status] || 'bg-gray-400'}
                              `}
                            >
                              {articleTitles[post.article_id]?.substring(0, 10) || `#${post.article_id}`}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <div className="space-y-1">
                              <p className="font-medium">{articleTitles[post.article_id] || `文章 #${post.article_id}`}</p>
                              <p className="text-xs text-muted-foreground">{post.site_name}</p>
                              <p className="text-xs">
                                {format(toZonedTime(new Date(post.scheduled_time), 'Asia/Taipei'), 'HH:mm')}
                              </p>
                              <Badge variant={post.status === 'success' ? 'default' : post.status === 'failed' ? 'destructive' : 'secondary'}>
                                {statusLabels[post.status] || post.status}
                              </Badge>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {dayPosts.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{dayPosts.length - 2} 更多
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 圖例 */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>已排程</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span>發送中</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>成功</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>失敗</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 日期詳情對話框 */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDate && format(selectedDate, 'yyyy年M月d日', { locale: zhTW })} 排程
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              {selectedDatePosts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {articleTitles[post.article_id] || `文章 #${post.article_id}`}
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {post.site_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(toZonedTime(new Date(post.scheduled_time), 'Asia/Taipei'), 'HH:mm')} (台北時間)
                        </p>
                        <div className="mt-2">
                          <Badge variant={
                            post.status === 'success' ? 'default' : 
                            post.status === 'failed' ? 'destructive' : 
                            'secondary'
                          }>
                            {statusLabels[post.status] || post.status}
                          </Badge>
                        </div>
                        {post.error_message && (
                          <p className="text-xs text-destructive mt-2">{post.error_message}</p>
                        )}
                      </div>
                      {post.status === 'scheduled' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            onDelete(post.id);
                            setDialogOpen(false);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
