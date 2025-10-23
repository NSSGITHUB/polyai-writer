import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Send } from "lucide-react";

interface WordPressSite {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
}

interface SendToWordPressDialogProps {
  articleId: number;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export const SendToWordPressDialog = ({ articleId, variant = "default", size = "default" }: SendToWordPressDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sites, setSites] = useState<WordPressSite[]>([]);
  const [selectedSites, setSelectedSites] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [publishStatus, setPublishStatus] = useState<'draft' | 'publish'>('draft');

  useEffect(() => {
    if (open) {
      fetchSites();
    }
  }, [open]);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("wordpress_sites")
        .select("id, name, url, is_active")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setSites(data || []);
      
      // 預設全選
      setSelectedSites((data || []).map(site => site.id));
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

  const handleSend = async () => {
    if (selectedSites.length === 0) {
      toast({
        title: "請選擇站點",
        description: "請至少選擇一個 WordPress 站點",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke('send-to-wordpress', {
        body: {
          articleId,
          siteIds: selectedSites,
          status: publishStatus,
        },
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: "發送成功",
          description: data.message,
        });
        setOpen(false);
      } else {
        throw new Error(data.error || '發送失敗');
      }
    } catch (error) {
      console.error("Error sending to WordPress:", error);
      toast({
        title: "發送失敗",
        description: error.message || "無法發送文章到 WordPress",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const toggleSite = (siteId: string) => {
    setSelectedSites(prev =>
      prev.includes(siteId)
        ? prev.filter(id => id !== siteId)
        : [...prev, siteId]
    );
  };

  const toggleAll = () => {
    if (selectedSites.length === sites.length) {
      setSelectedSites([]);
    } else {
      setSelectedSites(sites.map(site => site.id));
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Send className="mr-2 h-4 w-4" />
          發送到 WordPress
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>選擇 WordPress 站點</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">載入中...</div>
        ) : sites.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">尚未設定任何 WordPress 站點</p>
            <Button onClick={() => window.open('/wordpress-sites', '_blank')}>
              前往設定
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-3 pb-3 border-b">
              <h4 className="text-sm font-medium">發布狀態</h4>
              <RadioGroup value={publishStatus} onValueChange={(value: 'draft' | 'publish') => setPublishStatus(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="draft" id="draft" />
                  <Label htmlFor="draft" className="cursor-pointer font-normal">
                    草稿（需在 WordPress 後台發布）
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="publish" id="publish" />
                  <Label htmlFor="publish" className="cursor-pointer font-normal">
                    直接發布
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="flex items-center space-x-2 pb-2 border-b">
              <Checkbox
                id="select-all"
                checked={selectedSites.length === sites.length}
                onCheckedChange={toggleAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                全選 ({selectedSites.length}/{sites.length})
              </label>
            </div>
            
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {sites.map((site) => (
                <div key={site.id} className="flex items-center space-x-2 p-2 hover:bg-accent rounded">
                  <Checkbox
                    id={site.id}
                    checked={selectedSites.includes(site.id)}
                    onCheckedChange={() => toggleSite(site.id)}
                  />
                  <label htmlFor={site.id} className="flex-1 cursor-pointer">
                    <div className="font-medium">{site.name}</div>
                    <div className="text-xs text-muted-foreground">{site.url}</div>
                  </label>
                </div>
              ))}
            </div>

            <Button
              onClick={handleSend}
              disabled={sending || selectedSites.length === 0}
              className="w-full"
            >
              {sending ? "發送中..." : `發送到 ${selectedSites.length} 個站點`}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
