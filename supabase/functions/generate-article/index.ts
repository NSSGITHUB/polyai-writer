import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  topic: string;
  keywords?: string;
  outline?: string;
  language?: string;
  style?: string;
  wordCount?: number;
  provider: "openai" | "google" | "anthropic" | "xai";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: GenerateRequest = await req.json();
    const {
      topic,
      keywords = "",
      outline = "",
      language = "zh-TW",
      style = "professional",
      wordCount = 1000,
      provider,
    } = body;

    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing required field: topic" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!provider) {
      return new Response(
        JSON.stringify({ error: "Missing required field: provider" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 內文淨化：移除 Markdown 格式和模型常見的回應前言
    const sanitize = (text: string) => {
      let t = text
        // 移除 Markdown 標題符號 (# ## ### 等)
        .replace(/^#{1,6}\s+/gm, '')
        // 移除粗體和斜體 (** __ * _)
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/__([^_]+)__/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/_([^_]+)_/g, '$1')
        // 移除行內程式碼
        .replace(/`([^`]+)`/g, '$1')
        // 移除列表符號 (- * + 數字.)
        .replace(/^[\s]*[-*+]\s+/gm, '')
        .replace(/^[\s]*\d+\.\s+/gm, '')
        // 移除連結格式 [text](url)
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // 移除圖片格式 ![alt](url)
        .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
        // 移除水平線
        .replace(/^[-*_]{3,}$/gm, '')
        // 移除開頭常見前言
        .replace(/^\s*(好的，?這是一篇|好的，這是|以下是|根據您的要求|如您所需|符合您要求|我將為您|我會為您).*/im, '')
        // 移除包含「字數」說明的整行
        .replace(/^.*(字數|200\s*[–-]\s*300\s*字|3000\s*字|±10%).*$/gim, '')
        // 移除「回應內容」等meta字眼
        .replace(/^.*(回應內容|回覆內容|生成內容|以下內容).*$/gim, '')
        // 移除多餘括號說明
        .replace(/（\s*例如.*?）/g, '')
        .replace(/\(\s*例如.*?\)/g, '')
        // 收斂多餘空白行
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      // 再次清理開頭殘留的標點與空白
      t = t.replace(/^(。|，|：|:|\s)+/g, '').trim();
      return t;
    };

    // 根據不同提供商調整prompt - 人性化 SEO 優化文章
    const buildPrompt = (provider: string) => {
      let basePrompt = `【角色設定】
你是一位擁有 15 年資歷的「資深內容行銷策略師」與「數位專欄作家」。你的寫作風格融合了專業的洞察力與親切的對話感，擅長將複雜的知識轉化為普通讀者也能輕鬆吸收的文章。你的目標不是為了填滿字數，而是為了真正解決讀者的問題。

請以${language}撰寫關於【${topic}】的文章。

【核心寫作指導原則】—— 去除 AI 腔的關鍵

打破固定模式：
嚴禁使用 AI 慣用的開場白（例如：「在當今快速發展的時代...」、「XXX 是成功的關鍵...」）。直接切入重點或用一個引人入勝的案例開場。

語氣多樣化：
- 使用「第一人稱」（我、我們）來增加親近感與真實感
- 混合使用長句與短句，營造文章的節奏感（Staccato rhythm）
- 適時加入反問句（例如：「你也曾遇過這種情況嗎？」）來引發讀者思考

增加「經驗感」：
內容中應包含具體的場景描述、假想實驗或「專業人士才知道的小細節」。

拒絕廢話：
每一段話都必須具備資訊價值，避免重複陳述已知的概念。

`;

      // 關鍵字策略
      if (keywords) {
        basePrompt += `【關鍵字佈局】
核心關鍵字：${keywords}
- 將關鍵字自然地融入前 150 字內
- 在內文中以同義詞或相關詞彙（LSI 關鍵字）替換，避免過度堆砌

`;
      }

      // 大綱參考
      if (outline) {
        basePrompt += `【內容方向參考】
${outline}

`;
      }

      // 字數控制
      basePrompt += `【篇幅要求】約 ${wordCount} 字，寫得充實完整

`;

      basePrompt += `【SEO 結構要求】

標題 (H1)：
必須極具吸引力（Click-worthy），並包含核心關鍵字。

副標題 (H2, H3)：
使用具備搜尋意圖的標題，確保讀者掃視時能快速掌握重點。

【文章輸出結構】請按照以下結構撰寫：

1. [引人入勝的開場]
   用痛點或故事帶入主題。不要用「你是否曾經...」這種老套開場，直接講一個具體場景或反直覺的觀點。

2. [核心內容節點]
   至少包含 3 個具備實操價值的段落。每個段落要有：
   - 一個明確的重點
   - 具體的例子或數據
   - 可執行的建議

3. [專家小撇步]
   插入一個「💡 專家建議」區塊，分享一個業界內幕或進階技巧。

4. [常見問題 (FAQ)]
   3-5 個該領域的常見問題，使用問答形式。
   問題要像真人會問的那樣自然，回答要簡潔直接。

5. [行動呼籲 (CTA)]
   不要用死板的總結，而是給出下一個具體行動。
   例如：「現在就打開你的...試試看」「下一步，你可以...」

【寫作風格定位】${style}

【語氣範例】
✓ 「說實話，一開始我也踩過這個坑...」
✓ 「這邊有個小技巧，很多人不知道，但超級實用！」
✓ 「你可能會想：這真的有用嗎？讓我分享一個真實案例...」
✓ 「等等，在你繼續往下看之前，先問自己一個問題...」

【絕對禁止】
- 不要用任何 Markdown 格式符號（# * - ** [] 等）
- 不要有「以下是...」「好的，這是...」「根據您的要求」等 AI 開場白
- 不要提到字數要求或任何指令內容
- 不要用「在當今...」「隨著...的發展」「眾所周知」等老套開場
- 不要每段都用同樣的句式開頭
- 不要空泛說教，要有具體案例和數據支撐

【現在開始】
直接從一個吸引人的開場開始寫。讓讀者感覺是在看一位專業朋友的分享，不是冰冷的 AI 文章。`;

      return basePrompt;
    };

    const prompt = buildPrompt(provider);

    let generatedText = "";

    // OpenAI API
    if (provider === "openai") {
      const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
      if (!OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "你是一位資深內容行銷策略師與數位專欄作家。請用純文字撰寫文章，絕對禁止使用任何 Markdown 格式（# * - ** ` [] 等符號）。直接輸出乾淨的純文字內容，用段落和換行來組織結構。" },
            { role: "user", content: prompt },
          ],
          max_tokens: Math.min(Math.ceil(wordCount * 5), 16000),
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("OpenAI error:", error);
        return new Response(
          JSON.stringify({ error: "OpenAI API error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const data = await response.json();
      generatedText = data.choices?.[0]?.message?.content ?? "";
    }

    // Google Gemini API
    else if (provider === "google") {
      const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
      if (!GOOGLE_API_KEY) {
        return new Response(
          JSON.stringify({ error: "GOOGLE_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: Math.min(Math.ceil(wordCount * 2.5), 8000),
            },
          }),
        },
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Google error:", error);
        return new Response(
          JSON.stringify({ error: "Google API error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const data = await response.json();
      generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    }

    // Anthropic Claude API
    else if (provider === "anthropic") {
      const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
      if (!ANTHROPIC_API_KEY) {
        return new Response(
          JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: Math.ceil(wordCount * 4),
          system: "你是一位資深內容行銷策略師與數位專欄作家。請用純文字撰寫文章，絕對禁止使用任何 Markdown 格式（# * - ** ` [] 等符號）。直接輸出乾淨的純文字內容。",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("Anthropic error:", error);
        return new Response(
          JSON.stringify({ error: "Anthropic API error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const data = await response.json();
      generatedText = data.content?.[0]?.text ?? "";
    }

    // xAI Grok API
    else if (provider === "xai") {
      const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
      if (!XAI_API_KEY) {
        return new Response(
          JSON.stringify({ error: "XAI_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${XAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "grok-beta",
          messages: [
            { role: "system", content: "你是一位資深內容行銷策略師與數位專欄作家。請用純文字撰寫文章，絕對禁止使用任何 Markdown 格式（# * - ** ` [] 等符號）。直接輸出乾淨的純文字內容。" },
            { role: "user", content: prompt },
          ],
          max_tokens: Math.ceil(wordCount * 4),
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error("xAI error:", error);
        return new Response(
          JSON.stringify({ error: "xAI API error" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      const data = await response.json();
      generatedText = data.choices?.[0]?.message?.content ?? "";
    }

    const cleaned = sanitize(generatedText || '');

    return new Response(
      JSON.stringify({ generatedText: cleaned, provider }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("generate-article error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});