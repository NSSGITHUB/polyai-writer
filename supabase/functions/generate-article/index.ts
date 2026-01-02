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

    // 內文淨化：移除模型常見的「回應前言 / 指令重述 / 字數說明」
    const sanitize = (text: string) => {
      let t = text
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

    // 根據不同提供商調整prompt - 高品質 SEO 優化文章
    const buildPrompt = (provider: string) => {
      let basePrompt = `你是一位專業的 SEO 內容策略專家，擁有超過 10 年的搜尋引擎優化經驗。請以${language}撰寫一篇能在 Google 搜尋結果中取得高排名的專業文章。

【文章主題】${topic}

【SEO 優化核心要求】
1. **標題優化**：在文章開頭使用一個吸引人且包含主要關鍵字的標題（50-60字符最佳）
2. **E-E-A-T 原則**：展現專業知識(Expertise)、權威性(Authority)、可信度(Trustworthiness)和經驗(Experience)
3. **搜尋意圖匹配**：內容必須完整回答使用者可能的搜尋問題
4. **結構化內容**：使用清晰的層級結構，方便讀者快速獲取資訊

`;

      // 關鍵字策略
      if (keywords) {
        basePrompt += `【關鍵字 SEO 策略】
主要關鍵字：${keywords}
- 主要關鍵字需出現在：標題、前100字、至少2-3個小標題、結尾段落
- 自然融入相關長尾關鍵字和語義相關詞彙
- 關鍵字密度控制在 1-2%（自然融入，絕不堆砌）
- 使用關鍵字的同義詞和相關變體增加語義覆蓋

`;
      }

      // 大綱參考
      if (outline) {
        basePrompt += `【內容大綱參考】
${outline}

`;
      }

      // 字數控制
      if (provider === 'google') {
        basePrompt += `【字數要求】文章總字數控制在 ${wordCount} 字左右（誤差±10%）\n\n`;
      } else {
        basePrompt += `【字數要求】文章總字數必須達到 ${wordCount} 字以上，這是 SEO 長文章的基本要求\n\n`;
      }

      basePrompt += `【高品質 SEO 文章結構】
1. **引言段落（200-300字）**
   - 開門見山點出讀者痛點或問題
   - 說明本文將提供的解決方案或價值
   - 讓讀者在前3秒內知道這篇文章值得繼續閱讀

2. **核心內容段落**
   - 每個主要觀點使用清晰的小標題（H2/H3）
   - 每個段落聚焦一個核心論點，提供：
     * 具體數據和統計資料（如有相關）
     * 真實案例或情境說明
     * 專家觀點或權威引用
     * 實用的操作步驟或建議
   - 使用項目符號列表增加可讀性
   - 適當使用問答形式回應常見問題

3. **FAQ 區塊（3-5個常見問題）**
   - 使用「問：」「答：」的格式
   - 針對使用者真正會搜尋的問題
   - 答案簡潔精準，直接解決疑問

4. **結論段落（200-300字）**
   - 總結文章的核心價值和關鍵要點
   - 提供明確的行動呼籲（CTA）
   - 鼓勵讀者採取下一步行動

【寫作風格】
- 風格定位：${style}
- 使用主動語態，句子簡潔有力
- 避免冗長句子（每句不超過30字為佳）
- 段落適當分隔，提升視覺舒適度
- 語氣專業但親切，建立與讀者的連結

【禁止事項】
- 不要使用任何 Markdown 格式符號（如 #、*、-、**、[]等）
- 不要出現「以下是…」「好的，這是…」等開場白
- 不要提及字數要求或任何與指令相關的內容
- 不要使用過於誇張或不實的宣稱
- 不要複製貼上的內容，每篇文章都必須原創

【輸出要求】
直接輸出完整文章正文，以標題開始，不需要任何前言說明。`;

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
          model: "gpt-5-mini-2025-08-07",
          messages: [
            { role: "system", content: "You are a professional SEO content writer. Always write complete articles that meet the exact word count requirements. Make sure to write fully detailed content to reach the target word count." },
            { role: "user", content: prompt },
          ],
          max_completion_tokens: Math.min(Math.ceil(wordCount * 5), 16000),
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${GOOGLE_API_KEY}`,
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
            { role: "system", content: "You are a professional SEO content writer. Always write complete articles that meet the exact word count requirements." },
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