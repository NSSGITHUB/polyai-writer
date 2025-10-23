-- 創建 WordPress 站點配置表
CREATE TABLE IF NOT EXISTS public.wordpress_sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  username TEXT NOT NULL,
  app_password TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 創建 WordPress 發送記錄表
CREATE TABLE IF NOT EXISTS public.wordpress_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id INTEGER NOT NULL,
  site_id UUID NOT NULL REFERENCES public.wordpress_sites(id) ON DELETE CASCADE,
  wordpress_post_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 啟用 RLS
ALTER TABLE public.wordpress_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wordpress_posts ENABLE ROW LEVEL SECURITY;

-- WordPress 站點的 RLS 策略
CREATE POLICY "Users can view their own sites"
ON public.wordpress_sites
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sites"
ON public.wordpress_sites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sites"
ON public.wordpress_sites
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sites"
ON public.wordpress_sites
FOR DELETE
USING (auth.uid() = user_id);

-- WordPress 發送記錄的 RLS 策略
CREATE POLICY "Users can view their own posts"
ON public.wordpress_posts
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.wordpress_sites
  WHERE wordpress_sites.id = wordpress_posts.site_id
  AND wordpress_sites.user_id = auth.uid()
));

CREATE POLICY "Users can create their own posts"
ON public.wordpress_posts
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.wordpress_sites
  WHERE wordpress_sites.id = wordpress_posts.site_id
  AND wordpress_sites.user_id = auth.uid()
));

CREATE POLICY "Users can update their own posts"
ON public.wordpress_posts
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.wordpress_sites
  WHERE wordpress_sites.id = wordpress_posts.site_id
  AND wordpress_sites.user_id = auth.uid()
));

-- 創建索引以提升查詢效能
CREATE INDEX idx_wordpress_sites_user_id ON public.wordpress_sites(user_id);
CREATE INDEX idx_wordpress_posts_article_id ON public.wordpress_posts(article_id);
CREATE INDEX idx_wordpress_posts_site_id ON public.wordpress_posts(site_id);

-- 創建更新時間戳的函數
CREATE OR REPLACE FUNCTION public.update_wordpress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 為表添加自動更新時間戳的觸發器
CREATE TRIGGER update_wordpress_sites_updated_at
BEFORE UPDATE ON public.wordpress_sites
FOR EACH ROW
EXECUTE FUNCTION public.update_wordpress_updated_at();

CREATE TRIGGER update_wordpress_posts_updated_at
BEFORE UPDATE ON public.wordpress_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_wordpress_updated_at();