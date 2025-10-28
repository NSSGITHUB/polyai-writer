import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

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

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    console.log('Generating image with OpenAI, prompt:', prompt);

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt,
        size: '1024x1024',
        n: 1
      }),
    });

    let data: any;

    if (!response.ok) {
      // Try to parse error for fallback
      const errText = await response.text();
      console.error('OpenAI image generation error:', response.status, errText);
      let errJson: any = null;
      try { errJson = JSON.parse(errText); } catch {}

      const errMsg: string = errJson?.error?.message || '';

      // Fallback: if gpt-image-1 is not allowed (org not verified), try DALL·E 3
      if (response.status === 403 && errMsg.includes('gpt-image-1')) {
        console.log('Falling back to DALL·E 3');
        const dalleResp = await fetch('https://api.openai.com/v1/images/generations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt,
            size: '1024x1024',
            n: 1,
            response_format: 'b64_json'
          }),
        });

        if (!dalleResp.ok) {
          const t = await dalleResp.text();
          console.error('DALL·E 3 image generation error:', dalleResp.status, t);
          return new Response(
            JSON.stringify({ error: 'AI 服務錯誤', details: t }),
            { status: dalleResp.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        data = await dalleResp.json();
      } else {
        return new Response(
          JSON.stringify({ error: 'AI 服務錯誤', details: errText }),
          { status: response.status || 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      data = await response.json();
    }

    const b64 = data?.data?.[0]?.b64_json;

    if (!b64) {
      console.error('No base64 image returned:', JSON.stringify(data));
      throw new Error('未能獲取圖片資料');
    }

    const imageUrl = `data:image/png;base64,${b64}`;

    console.log('Image generated successfully via OpenAI');

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
