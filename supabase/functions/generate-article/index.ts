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

    // 內文淨化：清理 HTML 輸出，移除程式碼區塊標記
    const sanitize = (text: string) => {
      let t = text
        // 移除 ```html 和 ``` 標記
        .replace(/^```html\s*/gi, '')
        .replace(/^```\s*/gm, '')
        .replace(/```$/gm, '')
        // 移除開頭常見前言
        .replace(/^\s*(好的，?這是一篇|好的，這是|以下是|根據您的要求|如您所需|符合您要求|我將為您|我會為您).*/im, '')
        // 移除包含「字數」說明的整行
        .replace(/^.*(字數|200\s*[–-]\s*300\s*字|3000\s*字|±10%).*$/gim, '')
        // 移除「回應內容」等meta字眼
        .replace(/^.*(回應內容|回覆內容|生成內容|以下內容).*$/gim, '')
        // 收斂多餘空白行
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      return t;
    };

    // 根據不同提供商調整prompt - HTML 格式 SEO 優化文章
    const buildPrompt = (provider: string) => {
      let basePrompt = `【角色設定】
你是一位專業的 SEO 內容專家。

【任務】
撰寫一篇關於「${topic}」的詳細文章，使用繁體中文。

【輸出格式】
僅輸出 HTML body 內容，不要包含 <!DOCTYPE>、<html>、<head>、<body> 等外層標籤。

【必要要求】
1. 在第一段使用 <strong>${topic}</strong> 標記主題關鍵字
2. 必須包含一個詳細的 HTML 比較表格 (<table>)，至少 3 欄 4 列，使用以下樣式：
   <table class="table table-bordered table-striped">
     <thead class="table-dark">
       <tr><th>欄位1</th><th>欄位2</th><th>欄位3</th></tr>
     </thead>
     <tbody>
       <tr><td>內容</td><td>內容</td><td>內容</td></tr>
     </tbody>
   </table>
3. 使用 <h2> 和 <h3> 標籤組織結構
4. 使用 <p> 標籤包裹段落
5. 使用 <ul> 或 <ol> 標籤製作列表
6. 使用 <blockquote> 標籤製作引用區塊

`;

      // 關鍵字策略
      if (keywords) {
        basePrompt += `【關鍵字佈局】
核心關鍵字：${keywords}
- 將關鍵字自然融入第一段
- 在內文中適當使用 <strong> 標記重要關鍵字

`;
      }

      // 大綱參考
      if (outline) {
        basePrompt += `【內容方向參考】
${outline}

`;
      }

      // 字數控制
      basePrompt += `【篇幅要求】約 ${wordCount} 字，內容充實完整

`;

      basePrompt += `【SEO 結構要求】

標題 (H2)：
必須極具吸引力且包含核心關鍵字。

副標題 (H3)：
使用具備搜尋意圖的標題，確保讀者掃視時能快速掌握重點。

【文章輸出結構】

1. <h2>吸引人的主標題</h2>
   <p>開場段落，包含 <strong>關鍵字</strong>，用痛點或故事帶入主題。</p>

2. <h2>核心內容標題</h2>
   至少 3 個實用段落，每段要有明確重點、具體例子和可執行建議。

3. <h2>比較分析</h2>
   插入比較表格，幫助讀者理解不同選項的優缺點。

4. <h3>💡 專家建議</h3>
   <blockquote>分享業界內幕或進階技巧</blockquote>

5. <h2>常見問題 FAQ</h2>
   使用 <h3> 作為問題，<p> 作為回答，3-5 個常見問題。

6. <h2>總結與行動呼籲</h2>
   <p>給出具體的下一步行動建議。</p>

【寫作風格】${style}
- 使用第一人稱增加親近感
- 混合長短句營造節奏感
- 加入反問句引發讀者思考
- 包含具體場景描述和專業細節

【絕對禁止】
- 不要輸出任何 Markdown 格式（# * - ** [] 等）
- 不要輸出 \`\`\`html 或 \`\`\` 標記
- 不要有「以下是...」「好的，這是...」等 AI 開場白
- 不要提到字數要求或任何指令內容
- 直接輸出乾淨的 HTML 內容

【現在開始】
直接輸出 HTML 內容，從 <h2> 開始。`;

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
            { role: "system", content: "你是一位專業 SEO 內容專家。請輸出純 HTML 格式的文章內容（使用 <h2>、<h3>、<p>、<table>、<ul>、<blockquote> 等標籤）。絕對禁止使用 Markdown 格式和 ```html 標記。直接輸出乾淨的 HTML body 內容。" },
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
          system: "你是一位專業 SEO 內容專家。請輸出純 HTML 格式的文章內容（使用 <h2>、<h3>、<p>、<table>、<ul>、<blockquote> 等標籤）。絕對禁止使用 Markdown 格式和 ```html 標記。直接輸出乾淨的 HTML body 內容。",
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
            { role: "system", content: "你是一位專業 SEO 內容專家。請輸出純 HTML 格式的文章內容（使用 <h2>、<h3>、<p>、<table>、<ul>、<blockquote> 等標籤）。絕對禁止使用 Markdown 格式和 ```html 標記。直接輸出乾淨的 HTML body 內容。" },
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