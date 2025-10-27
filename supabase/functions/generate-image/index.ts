import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, articleId } = await req.json();
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating image with prompt:', prompt);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages: [
            {
              role: 'system',
              content: [
                { type: 'text', text: 'You are an image generation model. Always return an image in message.images and avoid plain text responses.' }
              ]
            },
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt }
              ]
            }
          ],
          modalities: ['image', 'text']
        }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: '請求過於頻繁，請稍後再試' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: '需要充值，請到設定中添加額度' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI 服務錯誤' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response received:', JSON.stringify(data, null, 2));
    
    // 檢查回應結構
    if (!data.choices || !data.choices[0]) {
      console.error('Invalid response structure:', data);
      throw new Error('AI 回應格式錯誤');
    }

    const message = data.choices[0].message;
    console.log('Message structure:', JSON.stringify(message, null, 2));
    
    const imageUrl = message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error('No image URL found in response. Message:', message);
      throw new Error('未能從 AI 回應中提取圖片 URL');
    }

    console.log('Image URL extracted successfully');

    return new Response(
      JSON.stringify({ 
        imageUrl,
        articleId 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in generate-image function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : '未知錯誤' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
