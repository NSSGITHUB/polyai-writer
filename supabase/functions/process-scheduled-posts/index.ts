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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const now = new Date().toISOString();
    console.log(`Checking for scheduled posts at ${now}`);

    // 查找應該發送的文章（scheduled_time <= 現在時間 且 status = 'scheduled'）
    const { data: scheduledPosts, error: queryError } = await supabaseClient
      .from('wordpress_posts')
      .select(`
        id,
        article_id,
        site_id,
        scheduled_time,
        wordpress_sites (
          id,
          name,
          url,
          username,
          app_password,
          is_active
        )
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_time', now)
      .limit(10); // 每次處理最多10個

    if (queryError) {
      console.error('Error querying scheduled posts:', queryError);
      throw queryError;
    }

    if (!scheduledPosts || scheduledPosts.length === 0) {
      console.log('No scheduled posts to process');
      return new Response(
        JSON.stringify({ success: true, message: 'No scheduled posts to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${scheduledPosts.length} scheduled posts to process`);

    // 按文章ID分組
    const articleGroups = new Map<number, typeof scheduledPosts>();
    scheduledPosts.forEach(post => {
      if (!articleGroups.has(post.article_id)) {
        articleGroups.set(post.article_id, []);
      }
      articleGroups.get(post.article_id)!.push(post);
    });

    const API_BASE_URL = "https://autowriter.ai.com.tw/api";
    const results = [];

    for (const [articleId, posts] of articleGroups) {
      try {
        // 獲取文章內容
        const articleResponse = await fetch(`${API_BASE_URL}/get-article.php?id=${articleId}`);
        
        if (!articleResponse.ok) {
          throw new Error(`Failed to fetch article ${articleId}`);
        }
        
        const articleData = await articleResponse.json();
        
        if (!articleData.success || !articleData.data) {
          throw new Error(`Article ${articleId} not found`);
        }
        
        const article = articleData.data;
        console.log(`Processing article ${articleId}: ${article.title}`);
        
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

        // 發送到每個站點
        for (const post of posts) {
          const site = post.wordpress_sites as any;
          
          if (!site || !site.is_active) {
            console.log(`Skipping inactive site for post ${post.id}`);
            await supabaseClient
              .from('wordpress_posts')
              .update({ status: 'failed', error_message: '站點已停用' })
              .eq('id', post.id);
            continue;
          }

          try {
            // 更新狀態為發送中
            await supabaseClient
              .from('wordpress_posts')
              .update({ status: 'sending' })
              .eq('id', post.id);

            // 發送到 WordPress
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
              content: article.content,
              status: 'publish',
              excerpt: article.excerpt || '',
              date: post.scheduled_time,
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

            // 更新為成功
            await supabaseClient
              .from('wordpress_posts')
              .update({
                wordpress_post_id: wpData.id,
                status: 'success'
              })
              .eq('id', post.id);

            results.push({ postId: post.id, site: site.name, success: true });
          } catch (error) {
            console.error(`Error sending post ${post.id} to ${site.name}:`, error);
            const errorMessage = error instanceof Error ? error.message : String(error);
            
            // 更新為失敗
            await supabaseClient
              .from('wordpress_posts')
              .update({
                status: 'failed',
                error_message: errorMessage
              })
              .eq('id', post.id);

            results.push({ postId: post.id, site: site.name, success: false, error: errorMessage });
          }
        }
      } catch (error) {
        console.error(`Error processing article ${articleId}:`, error);
        // 標記所有該文章的posts為失敗
        const errorMessage = error instanceof Error ? error.message : String(error);
        await supabaseClient
          .from('wordpress_posts')
          .update({
            status: 'failed',
            error_message: errorMessage
          })
          .in('id', posts.map(p => p.id));
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} scheduled posts`,
        processed: results.length,
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in process-scheduled-posts:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});