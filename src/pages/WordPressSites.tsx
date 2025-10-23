import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Plus, Trash2, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WordPressSite {
  id: string;
  name: string;
  url: string;
  username: string;
  app_password: string;
  is_active: boolean;
  created_at: string;
}

const WordPressSites = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<WordPressSite | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    username: "",
    app_password: "",
    is_active: true,
  });

  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    try {
      const { data, error } = await supabase
        .from("wordpress_sites")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSites(data || []);
    } catch (error) {
      console.error("Error fetching sites:", error);
      toast({
        title: "載入失敗",
        description: "無法載入 WordPress 站點列表",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Auth error:", authError);
        throw new Error("認證失敗，請重新登入");
      }
      
      if (!user) {
        throw new Error("未登入，請先登入");
      }

      if (editingSite) {
        const { error } = await supabase
          .from("wordpress_sites")
          .update(formData)
          .eq("id", editingSite.id);

        if (error) {
          console.error("Update error:", error);
          throw error;
        }
        toast({ title: "更新成功", description: "WordPress 站點已更新" });
      } else {
        const { error } = await supabase
          .from("wordpress_sites")
          .insert([{ ...formData, user_id: user.id }]);

        if (error) {
          console.error("Insert error:", error);
          throw error;
        }
        toast({ title: "新增成功", description: "WordPress 站點已新增" });
      }

      setDialogOpen(false);
      setFormData({ name: "", url: "", username: "", app_password: "", is_active: true });
      setEditingSite(null);
      fetchSites();
    } catch (error: any) {
      console.error("Error saving site:", error);
      const errorMessage = error?.message || error?.error_description || "無法儲存 WordPress 站點設定";
      toast({
        title: "儲存失敗",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除此 WordPress 站點嗎？")) return;

    try {
      const { error } = await supabase
        .from("wordpress_sites")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "刪除成功", description: "WordPress 站點已刪除" });
      fetchSites();
    } catch (error) {
      console.error("Error deleting site:", error);
      toast({
        title: "刪除失敗",
        description: "無法刪除 WordPress 站點",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (site: WordPressSite) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      url: site.url,
      username: site.username,
      app_password: site.app_password,
      is_active: site.is_active,
    });
    setDialogOpen(true);
  };

  const toggleActive = async (site: WordPressSite) => {
    try {
      const { error } = await supabase
        .from("wordpress_sites")
        .update({ is_active: !site.is_active })
        .eq("id", site.id);

      if (error) throw error;
      fetchSites();
    } catch (error) {
      console.error("Error toggling site:", error);
      toast({
        title: "更新失敗",
        description: "無法更新站點狀態",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      <header className="container mx-auto px-4 pt-8">
        <Button
          onClick={() => navigate("/dashboard")}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回儀表板
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">WordPress 站點管理</h1>
            <p className="text-muted-foreground mt-1">管理您的 WordPress 網站，一鍵發佈文章</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-primary hover:shadow-glow">
                <Plus className="mr-2 h-4 w-4" />
                新增站點
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSite ? "編輯" : "新增"} WordPress 站點</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">站點名稱</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例如：我的部落格"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="url">WordPress 網址</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    placeholder="https://example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="username">使用者名稱</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="app_password">應用程式密碼</Label>
                  <Input
                    id="app_password"
                    type="password"
                    value={formData.app_password}
                    onChange={(e) => setFormData({ ...formData, app_password: e.target.value })}
                    placeholder="xxxx xxxx xxxx xxxx"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    在 WordPress 後台的「使用者 → 個人資料」中產生
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label htmlFor="is_active">啟用此站點</Label>
                </div>
                <Button type="submit" className="w-full">
                  {editingSite ? "更新" : "新增"}站點
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">載入中...</div>
          </Card>
        ) : sites.length === 0 ? (
          <Card className="p-6">
            <div className="text-center text-muted-foreground">
              尚未新增任何 WordPress 站點
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <Card key={site.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{site.name}</CardTitle>
                    <Switch
                      checked={site.is_active}
                      onCheckedChange={() => toggleActive(site)}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground truncate">{site.url}</p>
                    <p className="text-muted-foreground">使用者：{site.username}</p>
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(site)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        編輯
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(site.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        刪除
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default WordPressSites;
