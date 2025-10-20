import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { API_BASE_URL } from "@/lib/api";

interface ImageRecord {
  id: string;
  article_id: number | null;
  article_title: string | null;
  prompt: string;
  image_url: string;
  width: number;
  height: number;
  created_at: string;
  display_url?: string;
}

export default function ImageGallery() {
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const blobUrlsRef = useRef<string[]>([]);

  const dataURLToBlob = (dataUrl: string) => {
    const [header, base64] = dataUrl.split(",");
    const mimeMatch = header.match(/data:(.*?);base64/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  };

  useEffect(() => {
    loadImages();
    return () => {
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      blobUrlsRef.current = [];
    };
  }, []);

  const loadImages = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/auth');
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const response = await fetch(`${API_BASE_URL}/get-images.php?user_id=${user.id}`);
      const data = await response.json();
      
      if (data.success) {
        // revoke previous blob urls
        blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
        blobUrlsRef.current = [];

        const mapped: ImageRecord[] = data.images.map((img: ImageRecord) => {
          if (img.image_url && img.image_url.startsWith('data:image')) {
            try {
              const blob = dataURLToBlob(img.image_url);
              const url = URL.createObjectURL(blob);
              blobUrlsRef.current.push(url);
              return { ...img, display_url: url };
            } catch {
              return img;
            }
          }
          return img;
        });
        setImages(mapped);
      } else {
        toast.error(data.error || "載入圖片失敗");
      }
    } catch (error) {
      console.error("載入圖片錯誤:", error);
      toast.error("載入圖片失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (imageUrl: string, prompt: string) => {
    try {
      let href = imageUrl;
      if (imageUrl && imageUrl.startsWith('data:')) {
        const blob = dataURLToBlob(imageUrl);
        href = URL.createObjectURL(blob);
        // auto-revoke later
        setTimeout(() => URL.revokeObjectURL(href), 5000);
      }
      const link = document.createElement('a');
      link.href = href;
      link.download = `${prompt.slice(0, 30).replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("圖片下載已開始");
    } catch (error) {
      console.error("下載失敗:", error);
      toast.error("下載失敗，請稍後再試");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <Button
          onClick={() => navigate("/dashboard")}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回儀表板
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">圖片歷史記錄</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                載入中...
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                尚未生成任何圖片
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="aspect-square bg-muted relative">
                      {image.display_url || image.image_url ? (
                        <img 
                          src={image.display_url || image.image_url} 
                          alt={image.prompt}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error("圖片載入失敗:", image.id);
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23999'%3E圖片載入失敗%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          無圖片數據
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {image.prompt}
                      </p>
                      {image.article_title && (
                        <p className="text-xs text-muted-foreground mb-2">
                          文章: {image.article_title}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                        <span>{image.width} × {image.height}</span>
                        <span>{new Date(image.created_at).toLocaleDateString()}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(image.image_url, image.prompt)}
                        className="w-full"
                      >
                        <Download className="mr-2 h-3 w-3" />
                        下載圖片
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
