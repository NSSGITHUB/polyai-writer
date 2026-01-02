import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Trash2, RefreshCw, Calendar, List } from "lucide-react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";
import { ScheduleCalendar } from "@/components/ScheduleCalendar";

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

export default function ScheduledPosts() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [articleTitles, setArticleTitles] = useState<Record<number, string>>({});
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");

  useEffect(() => {
    checkAuth();
    fetchScheduledPosts();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const fetchScheduledPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wordpress_posts")
        .select(`
          id,
          created_at,
          scheduled_time,
          status,
          error_message,
          article_id,
          site_id,
          wordpress_post_id,
          wordpress_sites (
            name,
            url
          )
        `)
        .order("scheduled_time", { ascending: true });

      if (error) throw error;

      const formattedPosts = data.map(post => ({
        ...post,
        site_name: post.wordpress_sites?.name || "未知站點",
        site_url: post.wordpress_sites?.url || "",
        wordpress_sites: undefined,
      }));

      setPosts(formattedPosts);

      // 獲取文章標題
      const articleIds = [...new Set(formattedPosts.map(p => p.article_id))];
      const titles: Record<number, string> = {};
      
      for (const articleId of articleIds) {
        try {
          const response = await fetch(`https://autowriter.ai.com.tw/api/get-article.php?id=${articleId}`);
          const article = await response.json();
          if (article.title) {
            titles[articleId] = article.title;
          }
        } catch (err) {
          console.error(`Error fetching article ${articleId}:`, err);
          titles[articleId] = `文章 #${articleId}`;
        }
      }
      
      setArticleTitles(titles);
    } catch (error) {
      console.error("Error fetching scheduled posts:", error);
      toast({
        title: "載入失敗",
        description: "無法載入排程列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("wordpress_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "刪除成功",
        description: "排程已刪除",
      });

      fetchScheduledPosts();
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "刪除失敗",
        description: "無法刪除排程",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: "已排程", variant: "secondary" as const },
      sending: { label: "發送中", variant: "default" as const },
      success: { label: "成功", variant: "default" as const },
      failed: { label: "失敗", variant: "destructive" as const },
      pending: { label: "待處理", variant: "outline" as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: "outline" as const,
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold">排程管理</h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={fetchScheduledPosts}
            disabled={loading}
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">載入中...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">暫無排程記錄</p>
            <Button onClick={() => navigate("/articles")}>前往文章管理</Button>
          </div>
        ) : (
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "calendar" | "list")}>
            <TabsList className="mb-6">
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="h-4 w-4" />
                行事曆
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                列表
              </TabsTrigger>
            </TabsList>

            <TabsContent value="calendar">
              <ScheduleCalendar
                posts={posts}
                articleTitles={articleTitles}
                onDelete={handleDelete}
              />
            </TabsContent>

            <TabsContent value="list">
              <div className="bg-card rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>文章</TableHead>
                      <TableHead>站點</TableHead>
                      <TableHead>排程時間</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>建立時間</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((post) => (
                      <TableRow key={post.id}>
                        <TableCell className="font-medium">
                          {articleTitles[post.article_id] || `文章 #${post.article_id}`}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{post.site_name}</div>
                            <div className="text-xs text-muted-foreground">{post.site_url}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {post.scheduled_time
                            ? format(toZonedTime(new Date(post.scheduled_time), 'Asia/Taipei'), "yyyy/MM/dd HH:mm", { locale: zhTW }) + " (台北時間)"
                            : "立即發送"}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(post.status)}
                            {post.error_message && (
                              <p className="text-xs text-destructive">{post.error_message}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(post.created_at), "yyyy/MM/dd HH:mm", { locale: zhTW })}
                        </TableCell>
                        <TableCell className="text-right">
                          {post.status === "scheduled" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>確認刪除</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    確定要刪除這個排程嗎？此操作無法撤銷。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(post.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    刪除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
