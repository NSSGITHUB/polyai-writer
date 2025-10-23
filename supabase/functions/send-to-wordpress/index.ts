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

    const { articleId, siteIds } = await req.json();
    
    if (!articleId || !siteIds || !Array.isArray(siteIds) || siteIds.length === 0) {
      throw new Error('Missing required parameters');
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
          
          const wpResponse = await fetch(wpApiUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${credentials}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: article.title,
              content: article.content,
              status: 'draft', // 預設為草稿
              excerpt: article.excerpt || '',
            }),
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
          
          // 更新記錄為失敗
          await supabaseClient
            .from('wordpress_posts')
            .update({
              status: 'failed',
              error_message: errorMessage
            })
            .eq('article_id', articleId)
            .eq('site_id', site.id);

          return {
            site: site.name,
            success: false,
            error: errorMessage
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
