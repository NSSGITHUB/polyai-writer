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
  targetAudience?: string;
  searchIntent?: string;
  contentRequirements?: string;
  language?: string;
  style?: string;
  wordCount?: number;
  provider: "openai" | "google" | "anthropic" | "xai";
  includeYoutube?: boolean;
  includeImages?: boolean;
  includeSourceImages?: boolean;
  sourceUrl?: string;
}

// 從網頁抓取圖片 URL
async function scrapeImagesFromUrl(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
    
    if (!response.ok) {
      console.error(`Failed to fetch URL: ${response.status}`);
      return [];
    }
    
    const html = await response.text();
    
    // 提取圖片 URL
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
    const images: string[] = [];
    let match;
    
    while ((match = imgRegex.exec(html)) !== null) {
      let imgUrl = match[1];
      
      // 處理相對路徑
      if (imgUrl.startsWith('//')) {
        imgUrl = 'https:' + imgUrl;
      } else if (imgUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imgUrl = urlObj.origin + imgUrl;
      } else if (!imgUrl.startsWith('http')) {
        const urlObj = new URL(url);
        imgUrl = urlObj.origin + '/' + imgUrl;
      }
      
      // 過濾掉小圖標、logo 等
      if (!/(icon|logo|pixel|clear|svg|favicon|sprite|blank|spacer|button|arrow|loading)/i.test(imgUrl)) {
        // 確保圖片 URL 有效
        if (imgUrl.match(/\.(jpg|jpeg|png|gif|webp)/i) || imgUrl.includes('image')) {
          images.push(imgUrl);
        }
      }
    }
    
    // 去重並限制數量
    return [...new Set(images)].slice(0, 8);
  } catch (error) {
    console.error('Error scraping images:', error);
    return [];
  }
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
      targetAudience = "",
      searchIntent = "",
      contentRequirements = "",
      language = "zh-TW",
      style = "professional",
      wordCount = 3000,
      provider,
      includeYoutube = false,
      includeImages = false,
      includeSourceImages = false,
      sourceUrl = "",
    } = body;

    // 抓取來源網站圖片
    let scrapedImages: string[] = [];
    if (includeSourceImages && sourceUrl) {
      console.log('Scraping images from:', sourceUrl);
      scrapedImages = await scrapeImagesFromUrl(sourceUrl);
      console.log('Scraped images:', scrapedImages.length);
    }

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

    const currentYear = new Date().getFullYear();

    // 內文淨化：清理 HTML 輸出
    const sanitize = (text: string) => {
      let t = text
        .replace(/^```html\s*/gi, '')
        .replace(/^```\s*/gm, '')
        .replace(/```$/gm, '')
        .replace(/^\s*(好的，?這是一篇|好的，這是|以下是|根據您的要求|如您所需|符合您要求|我將為您|我會為您|Here is|Here's|I've created|I have created).*/im, '')
        .replace(/^.*(字數|200\s*[–-]\s*300\s*字|3000\s*字|±10%).*$/gim, '')
        .replace(/^.*(回應內容|回覆內容|生成內容|以下內容).*$/gim, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      return t;
    };

    // 構建高品質 SEO 文章提示詞（參考 getautoseo.com 風格）
    const buildPrompt = (provider: string) => {
      const minWords = Math.floor(wordCount * 0.9);
      const maxWords = Math.ceil(wordCount * 1.1);

      let prompt = `【角色設定】
你是一位頂尖的 SEO 內容專家與專業作家，擁有豐富的 ${topic} 領域知識。你的文章曾發表於權威網站，擅長撰寫能同時滿足搜尋引擎和讀者需求的高品質內容。

【核心任務】
撰寫一篇關於「${topic}」的深度長篇文章（目標 ${minWords}-${maxWords} 字），品質須達到專業媒體發布標準。使用繁體中文。

【輸出格式要求】
1. 僅輸出 HTML body 內容，不含 <!DOCTYPE>、<html>、<head>、<body> 等外層標籤
2. 直接從第一個 <h2> 開始輸出
3. 禁止使用 Markdown 格式（# * - ** [] 等）
4. 禁止輸出 \`\`\`html 或 \`\`\` 程式碼區塊標記
5. 禁止 AI 開場白如「以下是...」「好的，這是...」

【文章結構要求 - 必須完整執行】

1. 【引言區塊】（約 150-200 字）
   <h2>吸引人的主標題 - 包含「${topic}」關鍵字與年份 ${currentYear}</h2>
   <p>用痛點問題或場景開場，讓讀者產生共鳴。描述他們面臨的挑戰。</p>
   <p>點出解決方案的方向，預告本文將帶來的價值。包含 <strong>${topic}</strong> 關鍵字。</p>

2. 【核心內容】（至少 5 個主要章節，每章節 300-500 字）
   每個章節結構：
   <h2>章節標題（含相關關鍵字）</h2>
   <p>開場段落，說明本節重點...</p>
   
   <h3>子標題 1</h3>
   <p>詳細說明，包含具體例子和數據...</p>
   <ul>
     <li><strong>重點項目：</strong>詳細說明</li>
     <li><strong>重點項目：</strong>詳細說明</li>
     <li><strong>重點項目：</strong>詳細說明</li>
   </ul>
   
   <h3>子標題 2</h3>
   <p>進一步分析...</p>

3. 【比較分析章節】- 必須包含表格${scrapedImages.length > 0 ? '（含產品圖片）' : ''}
   <h2>主要方案/產品比較分析</h2>
   <p>介紹段落...</p>
   
   <table class="table table-bordered table-striped">
     <thead class="table-dark">
       <tr>
         ${scrapedImages.length > 0 ? '<th>產品圖片</th>' : ''}
         <th>方案/產品</th>
         <th>核心特色</th>
         <th>優點</th>
         <th>缺點</th>
         <th>適合對象</th>
         <th>參考價格</th>
       </tr>
     </thead>
     <tbody>
       ${scrapedImages.length > 0 ? `
       <tr><td><img src="${scrapedImages[0] || ''}" alt="產品圖片" style="max-width:100px;max-height:100px;object-fit:contain;"></td><td>選項A</td><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>
       <tr><td><img src="${scrapedImages[1] || scrapedImages[0] || ''}" alt="產品圖片" style="max-width:100px;max-height:100px;object-fit:contain;"></td><td>選項B</td><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>
       <tr><td><img src="${scrapedImages[2] || scrapedImages[0] || ''}" alt="產品圖片" style="max-width:100px;max-height:100px;object-fit:contain;"></td><td>選項C</td><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>
       <tr><td><img src="${scrapedImages[3] || scrapedImages[0] || ''}" alt="產品圖片" style="max-width:100px;max-height:100px;object-fit:contain;"></td><td>選項D</td><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>
       ` : `
       <tr><td>選項A</td><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>
       <tr><td>選項B</td><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>
       <tr><td>選項C</td><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>
       <tr><td>選項D</td><td>...</td><td>...</td><td>...</td><td>...</td><td>...</td></tr>
       `}
     </tbody>
   </table>
   ${scrapedImages.length > 0 ? `
   【重要】以上表格範例中的圖片 URL 已提供，請在生成表格時使用這些實際圖片：
   ${scrapedImages.map((img, i) => `圖片${i + 1}: ${img}`).join('\n   ')}
   ` : ''}
   <p>比較分析總結...</p>

4. 【專家建議區塊】
   <h3>💡 專家建議</h3>
   <blockquote>
     <p>分享業界內幕或進階技巧，提供讀者額外價值。這應該是一般文章不會提到的獨特見解。</p>
   </blockquote>

5. 【實戰指南章節】- 步驟化教學
   <h2>實戰操作指南：如何開始</h2>
   <p>介紹本節目的...</p>
   
   <h3>第一步：評估與規劃</h3>
   <p>詳細說明...</p>
   
   <h3>第二步：執行與實作</h3>
   <p>詳細說明...</p>
   
   <h3>第三步：監測與優化</h3>
   <p>詳細說明...</p>

6. 【FAQ 常見問題】（至少 5-8 個問題）
   <h2>${topic} 常見問題</h2>
   
   <h3>問題 1：xxxxxxx？</h3>
   <p>詳細回答，至少 50-80 字，提供實用資訊...</p>
   
   <h3>問題 2：xxxxxxx？</h3>
   <p>詳細回答...</p>
   
   （重複 5-8 個 FAQ）

7. 【結論與行動呼籲】
   <h2>結論：立即行動，掌握 ${topic} 的優勢</h2>
   <p>總結文章重點...</p>
   <p>提供具體的下一步行動建議，鼓勵讀者採取行動...</p>

`;

    // 添加關鍵字策略
    if (keywords) {
      prompt += `
【關鍵字策略】
核心關鍵字：${keywords}
- 主要關鍵字「${topic}」在文章中至少出現 8-12 次
- 相關關鍵字自然分布在各章節
- 在引言、結論、H2 標題中包含核心關鍵字
- 使用 <strong> 標記重點關鍵字（適度使用，不要過度）

`;
    }

    // 添加目標受眾
    if (targetAudience) {
      prompt += `
【目標受眾】
${targetAudience}
- 使用這個受眾熟悉的語言和例子
- 解決他們最關心的痛點
- 提供對他們最有價值的資訊

`;
    }

    // 添加搜尋意圖
    if (searchIntent) {
      prompt += `
【搜尋意圖】
${searchIntent}
- 確保文章完整回答使用者的核心問題
- 提供可執行的解決方案

`;
    }

    // 添加內容要求
    if (contentRequirements) {
      prompt += `
【特殊內容要求】
${contentRequirements}

`;
    }

    // 添加大綱參考
    if (outline) {
      prompt += `
【大綱參考】
${outline}

`;
    }

    // 添加來源網址資訊
    if (sourceUrl) {
      prompt += `
【參考來源】
請參考此來源的內容風格和資訊：${sourceUrl}

`;
    }

    prompt += `
【寫作風格要求】
風格：${style}
- 使用第一人稱（「我們」）增加親近感
- 混合長短句營造閱讀節奏
- 加入反問句引發讀者思考
- 包含具體數據、案例和場景描述
- 避免空泛的描述，每個觀點都要有支撐
- 保持專業但不失親和力

【SEO 優化要求】
1. 標題層級：H2 用於主要章節，H3 用於子主題
2. 每個 H2 章節至少包含 2-3 個段落
3. 適當使用項目符號列表（<ul><li>）組織資訊
4. 在適當位置插入表格比較
5. 使用 <blockquote> 突出重要引言或建議
6. 確保內容結構清晰、易於掃讀

【字數要求】
目標字數：${minWords}-${maxWords} 字
這是一篇長篇深度文章，請確保每個章節都有充實的內容。

【絕對禁止】
- 不要輸出任何 Markdown 格式
- 不要輸出 \`\`\`html 或 \`\`\` 標記
- 不要有「以下是...」「好的，這是...」等 AI 開場白
- 不要提到字數要求或任何指令內容
- 不要使用 Lorem ipsum 或佔位文字
- 不要重複相同的段落內容

【開始生成】
直接輸出 HTML 內容，從 <h2> 開始。確保文章完整、專業、有深度。`;

      return prompt;
    };

    const prompt = buildPrompt(provider);
    
    // 根據字數計算 token 數量（中文約 1.5-2 token/字）
    const estimatedTokens = Math.min(Math.ceil(wordCount * 3), 16000);

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
            { 
              role: "system", 
              content: "你是一位頂尖的 SEO 內容專家與專業作家。請輸出純 HTML 格式的長篇深度文章（使用 <h2>、<h3>、<p>、<table>、<ul>、<blockquote> 等標籤）。文章必須專業、詳盡、有深度。絕對禁止使用 Markdown 格式和 ```html 標記。直接輸出乾淨的 HTML body 內容。" 
            },
            { role: "user", content: prompt },
          ],
          max_tokens: estimatedTokens,
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: Math.min(estimatedTokens, 8000),
            },
            systemInstruction: {
              parts: [{
                text: "你是一位頂尖的 SEO 內容專家與專業作家。請輸出純 HTML 格式的長篇深度文章。文章必須專業、詳盡、有深度。絕對禁止使用 Markdown 格式。直接輸出乾淨的 HTML body 內容。"
              }]
            }
          }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Google error:", errorText);

        let message = "Google API error";
        try {
          const parsed = JSON.parse(errorText);
          message = parsed?.error?.message || message;
        } catch {
          // ignore JSON parse errors
        }

        return new Response(
          JSON.stringify({ error: message, provider: "google", status: response.status }),
          { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
          max_tokens: Math.min(estimatedTokens, 8000),
          system: "你是一位頂尖的 SEO 內容專家與專業作家。請輸出純 HTML 格式的長篇深度文章（使用 <h2>、<h3>、<p>、<table>、<ul>、<blockquote> 等標籤）。文章必須專業、詳盡、有深度。絕對禁止使用 Markdown 格式和 ```html 標記。直接輸出乾淨的 HTML body 內容。",
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
            { 
              role: "system", 
              content: "你是一位頂尖的 SEO 內容專家與專業作家。請輸出純 HTML 格式的長篇深度文章（使用 <h2>、<h3>、<p>、<table>、<ul>、<blockquote> 等標籤）。文章必須專業、詳盡、有深度。絕對禁止使用 Markdown 格式和 ```html 標記。直接輸出乾淨的 HTML body 內容。" 
            },
            { role: "user", content: prompt },
          ],
          max_tokens: estimatedTokens,
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

    // 計算實際字數（去除 HTML 標籤）
    const textOnly = cleaned.replace(/<[^>]*>/g, '').replace(/\s+/g, '');
    const actualWordCount = textOnly.length;

    return new Response(
      JSON.stringify({ 
        generatedText: cleaned, 
        provider,
        wordCount: actualWordCount,
        targetWordCount: wordCount
      }),
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
