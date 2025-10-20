import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Download, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface ImageRecord {
  id: string;
  article_id: number | null;
  article_title: string | null;
  prompt: string;
  image_url: string;
  width: number;
  height: number;
  created_at: string;
}

export default function ImageGallery() {
  const navigate = useNavigate();
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/auth');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8888'}/api/get-images.php?user_id=${userId}`
      );
      const data = await response.json();
      
      if (data.success) {
        setImages(data.images);
      } else {
        toast.error("載入圖片失敗");
      }
    } catch (error) {
      console.error("載入圖片錯誤:", error);
      toast.error("載入圖片失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (imageUrl: string, prompt: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${prompt.slice(0, 30)}-${Date.now()}.png`;
    link.click();
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
                      <img 
                        src={image.image_url} 
                        alt={image.prompt}
                        className="w-full h-full object-cover"
                      />
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
