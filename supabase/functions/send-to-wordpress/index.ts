import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { articleId, siteIds, status = 'draft', scheduledTime } = await req.json();
    
    if (!articleId || !siteIds || !Array.isArray(siteIds) || siteIds.length === 0) {
      throw new Error('Missing required parameters');
    }

    if (!['draft', 'publish'].includes(status)) {
      throw new Error('Invalid status. Must be "draft" or "publish"');
    }

    // 如果是定時發送，直接創建scheduled記錄
    if (scheduledTime) {
      const scheduledDate = new Date(scheduledTime);
      if (scheduledDate <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }

      console.log(`Scheduling article ${articleId} for ${siteIds.length} sites at ${scheduledTime}`);

      // 為每個站點創建scheduled記錄
      const scheduledRecords = siteIds.map(siteId => ({
        article_id: articleId,
        site_id: siteId,
        status: 'scheduled',
        scheduled_time: scheduledTime
      }));

      const { error: insertError } = await supabaseClient
        .from('wordpress_posts')
        .insert(scheduledRecords);

      if (insertError) {
        console.error('Error creating scheduled posts:', insertError);
        throw new Error(`Failed to schedule posts: ${insertError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `已排程 ${siteIds.length} 個站點`,
          scheduled: true
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Processing article ${articleId} for ${siteIds.length} sites`);

    // 獲取文章內容（從 PHP API）
    const API_BASE_URL = "https://autowriter.ai.com.tw/api";
    const articleResponse = await fetch(`${API_BASE_URL}/get-article.php?id=${articleId}`);
    
    if (!articleResponse.ok) {
      throw new Error(`Failed to fetch article: ${articleResponse.statusText}`);
    }
    
    const articleData = await articleResponse.json();
    
    if (!articleData.success || !articleData.data) {
      throw new Error('Article not found');
    }
    
    const article = articleData.data;
    console.log(`Article fetched: ${article.title}`);
    
    // 清理標題，移除 AI 提供者標記
    const cleanTitle = article.title.replace(/\s*\((GOOGLE|OPENAI|ANTHROPIC|GEMINI|GPT|CLAUDE)\)\s*$/i, '').trim();

    // 獲取文章的圖片（如果有）
    let featuredImageUrl = null;
    try {
      const imageResponse = await fetch(`${API_BASE_URL}/get-images.php?article_id=${articleId}`);
      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        if (imageData.success && imageData.data && imageData.data.length > 0) {
          featuredImageUrl = imageData.data[0].image_url;
        }
      }
    } catch (error) {
      console.error('Error fetching article image:', error);
    }

    // 獲取所有指定的 WordPress 站點
    const { data: sites, error: sitesError } = await supabaseClient
      .from('wordpress_sites')
      .select('*')
      .in('id', siteIds)
      .eq('is_active', true);

    if (sitesError) {
      console.error('Error fetching sites:', sitesError);
      throw new Error(`Failed to fetch sites: ${sitesError.message}`);
    }

    if (!sites || sites.length === 0) {
      throw new Error('No active sites found');
    }

    console.log(`Found ${sites.length} active sites`);

    // 發送到每個 WordPress 站點
    const results = await Promise.allSettled(
      sites.map(async (site) => {
        console.log(`Sending to ${site.name} (${site.url})`);
        
        try {
          // 創建 WordPress 發送記錄
          const { data: postRecord, error: recordError } = await supabaseClient
            .from('wordpress_posts')
            .insert({
              article_id: articleId,
              site_id: site.id,
              status: 'sending'
            })
            .select()
            .single();

          if (recordError) throw recordError;

          // 準備 WordPress API 請求
          const wpApiUrl = `${site.url.replace(/\/$/, '')}/wp-json/wp/v2/posts`;
          const credentials = btoa(`${site.username}:${site.app_password}`);
          
          // 如果有圖片，先上傳到WordPress
          let featuredMediaId = null;
          if (featuredImageUrl) {
            try {
              const imageBlob = await (await fetch(featuredImageUrl)).blob();
              const wpMediaUrl = `${site.url.replace(/\/$/, '')}/wp-json/wp/v2/media`;
              
              const formData = new FormData();
              formData.append('file', imageBlob, 'featured-image.png');
              
              const mediaResponse = await fetch(wpMediaUrl, {
                method: 'POST',
                headers: {
                  'Authorization': `Basic ${credentials}`,
                },
                body: formData,
              });

              if (mediaResponse.ok) {
                const mediaData = await mediaResponse.json();
                featuredMediaId = mediaData.id;
              }
            } catch (error) {
              console.error('Error uploading image to WordPress:', error);
            }
          }

          const postBody: any = {
            title: cleanTitle,
            content: featuredImageUrl ? `<p><img src="${featuredImageUrl}" alt="${cleanTitle}" /></p>\n\n${article.content}` : article.content,
            status: status,
            excerpt: article.excerpt || '',
            date: new Date().toISOString(),
          };

          if (featuredMediaId) {
            postBody.featured_media = featuredMediaId;
          }
          
          const wpResponse = await fetch(wpApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(postBody),
          });

          if (!wpResponse.ok) {
            const errorText = await wpResponse.text();
            throw new Error(`WordPress API error: ${wpResponse.status} - ${errorText}`);
          }

          const wpData = await wpResponse.json();
          console.log(`Successfully posted to ${site.name}, WordPress post ID: ${wpData.id}`);

          // 更新記錄為成功
          await supabaseClient
            .from('wordpress_posts')
            .update({
              wordpress_post_id: wpData.id,
              status: 'success'
            })
            .eq('id', postRecord.id);

          return {
            site: site.name,
            success: true,
            wordpressPostId: wpData.id,
            url: wpData.link
          };
        } catch (error) {
          console.error(`Error sending to ${site.name}:`, error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          // Convert technical errors to user-friendly messages
          let userFriendlyError = errorMessage;
          if (errorMessage.includes('invalid peer certificate: Expired')) {
            userFriendlyError = 'SSL 憑證已過期，請更新網站的 SSL 憑證';
          } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Failed to fetch')) {
            userFriendlyError = '無法連接到網站，請檢查網址是否正確';
          } else if (errorMessage.includes('401') || errorMessage.includes('403')) {
            userFriendlyError = '認證失敗，請檢查使用者名稱和應用程式密碼';
          } else if (errorMessage.includes('404')) {
            userFriendlyError = 'WordPress REST API 不存在，請確認網站支援 REST API';
          } else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
            userFriendlyError = '網站伺服器錯誤，請稍後再試';
          }
          
          // 更新記錄為失敗
          await supabaseClient
            .from('wordpress_posts')
            .update({
              status: 'failed',
              error_message: userFriendlyError
            })
            .eq('article_id', articleId)
            .eq('site_id', site.id);

          return {
            site: site.name,
            success: false,
            error: userFriendlyError
          };
        }
      })
    );

    const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failCount = results.length - successCount;

    return new Response(
      JSON.stringify({
        success: true,
        message: `已發送至 ${successCount} 個站點，${failCount} 個失敗`,
        results: results.map(r => r.status === 'fulfilled' ? r.value : { success: false, error: 'Unknown error' }),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-to-wordpress:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
