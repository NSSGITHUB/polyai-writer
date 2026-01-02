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

    // 根據不同提供商調整prompt - 人性化 SEO 優化文章
    const buildPrompt = (provider: string) => {
      let basePrompt = `你是一位資深的內容創作者，同時精通 SEO 策略。你的文章風格自然、真誠，就像在和好朋友分享專業知識。請以${language}撰寫一篇既能獲得 Google 高排名，又讀起來溫暖有溫度的文章。

【文章主題】${topic}

【人性化寫作核心原則】
1. **像人一樣說話**：用口語化但不失專業的語氣，避免生硬的學術腔調
2. **分享真實經驗**：用「我曾經...」「很多人會...」「說實話...」等開頭，增添真實感
3. **適度展現情緒**：可以表達驚訝、同理、幽默，讓文章有溫度
4. **提出問題引導**：用「你是否也有過這樣的經驗？」「想過為什麼嗎？」等方式與讀者對話

【SEO 優化重點】
1. **自然的關鍵字融入**：關鍵字要像正常說話一樣自然出現，絕不刻意堆砌
2. **E-E-A-T 原則**：透過分享經驗和專業見解展現可信度
3. **滿足搜尋意圖**：真正解決讀者的疑問，而不是繞圈子

`;

      // 關鍵字策略
      if (keywords) {
        basePrompt += `【關鍵字】${keywords}
- 將關鍵字自然融入對話中，就像平常說話會提到的那樣
- 可以用同義詞、口語說法替換，增加自然度
- 重要的是讓讀者覺得「這就是我想知道的」

`;
      }

      // 大綱參考
      if (outline) {
        basePrompt += `【內容方向參考】
${outline}

`;
      }

      // 字數控制
      if (provider === 'google') {
        basePrompt += `【篇幅】約 ${wordCount} 字（不用刻意計算，寫完整就好）\n\n`;
      } else {
        basePrompt += `【篇幅】請寫得充實完整，至少 ${wordCount} 字以上\n\n`;
      }

      basePrompt += `【文章結構建議】
1. **開場白（吸引注意）**
   - 用一個引人入勝的問題、故事或現象開場
   - 例如：「你有沒有想過，為什麼...」「最近我發現一件有趣的事...」
   - 讓讀者在前三句話就產生共鳴，想繼續看下去

2. **主要內容（娓娓道來）**
   - 用說故事的方式解釋概念，不要像教科書
   - 適時穿插「舉個例子」「打個比方」「說個小秘訣」
   - 每個段落保持簡短，一個重點一個段落
   - 可以用「首先...再來...最後...」或「第一點...」自然過渡
   - 偶爾加入個人觀察或業界常見誤區，增加可信度

3. **實用建議（讀者最想要的）**
   - 提供可以立即執行的具體步驟
   - 用「如果你想...可以試試...」的句型
   - 適度給出一些「小技巧」或「避坑指南」

4. **常見問題解答（3-5題）**
   - 用真正會問的口語化問題
   - 回答簡潔直接，不要繞圈子
   - 可以用「問：」「答：」格式，但回答要像聊天

5. **結語（溫暖收尾）**
   - 總結重點，但不要生硬列點
   - 給讀者一點鼓勵或期待
   - 可以用「希望這篇文章對你有幫助」「如果你有任何問題...」收尾

【寫作風格指引】
- 風格定位：${style}
- 句子長度適中，長短交錯有節奏感
- 適時使用「其實」「說真的」「老實說」「你知道嗎」等口語連接詞
- 可以用「！」表達驚喜，用「...」製造懸念
- 段落之間自然過渡，不要突兀跳轉
- 偶爾反問讀者，製造互動感

【語氣範例】
✓ 「說實話，一開始我也不懂這個道理...」
✓ 「你可能會想：這真的有用嗎？別擔心，讓我慢慢解釋...」
✓ 「這邊有個小技巧，很多人不知道，但超級實用！」
✓ 「我知道這聽起來有點複雜，但其實很簡單...」

【絕對禁止】
- 不要用任何 Markdown 格式符號（# * - ** [] 等）
- 不要有「以下是...」「好的，這是...」「根據您的要求」等 AI 開場白
- 不要提到字數要求或任何指令內容
- 不要用過於官方或機械的語氣
- 不要空泛地說「眾所周知」「毋庸置疑」等老套說法
- 不要每段都用同樣的句式開頭

【現在開始】
直接從一個吸引人的開場開始寫，不需要任何前言。讓讀者感覺是在看一位專業朋友的分享，而不是在讀一篇冰冷的文章。`;

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