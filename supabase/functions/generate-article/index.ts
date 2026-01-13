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
  youtubeChannelId?: string;
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

type SourcePlan = { name: string; priceText: string; source: "jsonld" | "text" };

type YoutubeVideo = { title: string; videoId: string; url: string };
type YoutubeSearchResult = { videos: YoutubeVideo[]; error?: string; status?: number };

const escapeHtmlAttr = (s: string) =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function formatPriceText(price: unknown, currency: unknown): string | null {
  const p = typeof price === "number" ? String(price) : typeof price === "string" ? price.trim() : "";
  if (!p) return null;

  const c = typeof currency === "string" ? currency.trim().toUpperCase() : "";
  const prefix =
    c === "TWD" || c === "NTD" ? "NT$" :
    c === "USD" ? "$" :
    c === "HKD" ? "HK$" :
    c === "JPY" ? "¥" :
    c ? `${c} ` : "";

  // Preserve existing prefix if the price string already has it
  if (/^(NT\$|HK\$|\$|¥)/.test(p)) return p;
  return `${prefix}${p}`.trim();
}

function flattenJsonLd(value: any): any[] {
  const out: any[] = [];
  const visit = (v: any) => {
    if (!v) return;
    if (Array.isArray(v)) return v.forEach(visit);
    if (typeof v !== "object") return;
    out.push(v);
    if (v["@graph"]) visit(v["@graph"]);
  };
  visit(value);
  return out;
}

async function scrapePlansFromUrl(url: string): Promise<SourcePlan[]> {
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });

    if (!resp.ok) {
      console.error(`Failed to fetch URL for plans: ${resp.status}`);
      return [];
    }

    const html = await resp.text();
    const plans: SourcePlan[] = [];

    // 1) JSON-LD (schema.org) products/offers
    const jsonLdRegex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let m: RegExpExecArray | null;
    while ((m = jsonLdRegex.exec(html)) !== null) {
      const raw = (m[1] || "").trim();
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw);
        const nodes = flattenJsonLd(parsed);

        for (const node of nodes) {
          const t = node?.["@type"];
          const types = Array.isArray(t) ? t : typeof t === "string" ? [t] : [];
          const isProduct = types.some((x) => String(x).toLowerCase().includes("product"));
          if (!isProduct) continue;

          const name = typeof node?.name === "string" ? node.name.trim() : "";
          const offers = node?.offers;
          const offerList = Array.isArray(offers) ? offers : offers ? [offers] : [];

          if (name) {
            if (!offerList.length) {
              plans.push({ name, priceText: "請見官網", source: "jsonld" });
              continue;
            }

            for (const off of offerList) {
              const price = off?.price ?? off?.lowPrice ?? off?.highPrice;
              const currency = off?.priceCurrency;
              const priceText = formatPriceText(price, currency) ?? "請見官網";
              plans.push({ name, priceText, source: "jsonld" });
            }
          }
        }
      } catch {
        // ignore invalid JSON
      }
    }

    // 2) Fallback: simple text-based price hints
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/\s+/g, " ")
      .trim();

    const priceRegex = /(.{0,40}?)(NT\$|NTD|HK\$|\$|¥)\s*([0-9][0-9,]*(?:\.[0-9]+)?)/g;
    let pMatch: RegExpExecArray | null;
    while ((pMatch = priceRegex.exec(text)) !== null) {
      const before = (pMatch[1] || "").trim();
      const symbol = pMatch[2] || "";
      const num = pMatch[3] || "";

      // Heuristic: pick a short-ish name near the price
      let name = before
        .replace(/[|｜:：•·]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (name.length > 30) name = name.slice(-30).trim();

      const priceText = `${symbol}${num}`.trim();
      if (!name) continue;
      if (!/[\u4E00-\u9FFFA-Za-z]/.test(name)) continue;

      plans.push({ name, priceText, source: "text" });

      if (plans.length >= 12) break;
    }

    // Deduplicate + keep top few
    const uniq: SourcePlan[] = [];
    const seen = new Set<string>();
    for (const p of plans) {
      const key = `${p.name}@@${p.priceText}`;
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(p);
      if (uniq.length >= 6) break;
    }

    return uniq;
  } catch (e) {
    console.error("Error scraping plans:", e);
    return [];
  }
}

// 從頻道 URL 或 ID 提取頻道 ID
function extractChannelId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();
  
  // 直接是頻道 ID（UC 開頭）
  if (/^UC[\w-]{22}$/.test(trimmed)) {
    return trimmed;
  }
  
  // YouTube 頻道 URL 格式
  // https://www.youtube.com/channel/UCxxxxxx
  const channelMatch = trimmed.match(/youtube\.com\/channel\/(UC[\w-]{22})/i);
  if (channelMatch) return channelMatch[1];
  
  // https://www.youtube.com/@username - 需要額外 API 呼叫，暫不支援
  // 返回 null，讓使用者知道需要使用頻道 ID
  if (trimmed.includes("youtube.com/@")) {
    return null;
  }
  
  return null;
}

async function searchYoutubeVideos({
  apiKey,
  query,
  maxResults,
  regionCode,
  relevanceLanguage,
  channelId,
}: {
  apiKey: string;
  query: string;
  maxResults: number;
  regionCode?: string;
  relevanceLanguage?: string;
  channelId?: string;
}): Promise<YoutubeSearchResult> {
  try {
    const u = new URL("https://www.googleapis.com/youtube/v3/search");
    u.searchParams.set("part", "snippet");
    u.searchParams.set("type", "video");
    u.searchParams.set("maxResults", String(maxResults));
    u.searchParams.set("videoEmbeddable", "true");
    u.searchParams.set("safeSearch", "moderate");
    u.searchParams.set("q", query);
    if (channelId) u.searchParams.set("channelId", channelId);
    if (regionCode) u.searchParams.set("regionCode", regionCode);
    if (relevanceLanguage) u.searchParams.set("relevanceLanguage", relevanceLanguage);
    u.searchParams.set("key", apiKey);

    const resp = await fetch(u.toString());
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      console.error("YouTube search error:", resp.status, text);
      let msg = "YouTube 搜尋失敗";
      try {
        const parsed = JSON.parse(text);
        msg = parsed?.error?.message || msg;
      } catch {
        if (text) msg = text.slice(0, 300);
      }
      return { videos: [], error: msg, status: resp.status };
    }

    const data = await resp.json();
    const items = Array.isArray(data?.items) ? data.items : [];

    const videos = items
      .map((it: any) => {
        const videoId = it?.id?.videoId as string | undefined;
        const title = it?.snippet?.title as string | undefined;
        if (!videoId) return null;
        return {
          videoId,
          title: title ?? "YouTube 影片",
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      })
      .filter(Boolean)
      .slice(0, maxResults) as YoutubeVideo[];

    return { videos };
  } catch (e) {
    console.error("YouTube search exception:", e);
    return { videos: [], error: e instanceof Error ? e.message : "YouTube 搜尋例外" };
  }
}

function buildYoutubeSection(topic: string, videos: YoutubeVideo[]): string {
  if (!videos.length) return "";

  const embeds = videos
    .map((v) => {
      const title = escapeHtmlAttr(v.title);
      const src = `https://www.youtube.com/embed/${encodeURIComponent(v.videoId)}`;
      return `
<div class="youtube-embed">
  <iframe
    width="560"
    height="315"
    src="${src}"
    title="${title}"
    loading="lazy"
    referrerpolicy="strict-origin-when-cross-origin"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
  <p><a href="${escapeHtmlAttr(v.url)}" target="_blank" rel="noopener noreferrer">${title}</a></p>
</div>`.trim();
    })
    .join("\n");

  return `
<section class="youtube-videos">
  <h2>推薦 YouTube 影片</h2>
  <p>以下影片與「${escapeHtmlAttr(topic)}」相關，方便你延伸學習：</p>
  ${embeds}
</section>`.trim();
}

function insertAfterSecondParagraph(html: string, insertion: string): string {
  if (!insertion.trim()) return html;
  const matches = Array.from(html.matchAll(/<\/p\s*>/gi));
  const target = matches[1] ?? matches[0];
  if (!target || typeof target.index !== "number") return html + "\n" + insertion;
  const idx = target.index + target[0].length;
  return html.slice(0, idx) + "\n" + insertion + "\n" + html.slice(idx);
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
      youtubeChannelId = "",
      includeImages = false,
      includeSourceImages = false,
      sourceUrl = "",
    } = body;

    // 抓取來源網站圖片（表格用）
    let scrapedImages: string[] = [];
    if (includeSourceImages && sourceUrl) {
      console.log("Scraping images from:", sourceUrl);
      scrapedImages = await scrapeImagesFromUrl(sourceUrl);
      console.log("Scraped images:", scrapedImages.length);
    }

    // 從來源頁面嘗試擷取「方案/商品」與「價格」（比較表格用）
    // 注意：若使用者輸入的是首頁/分類頁，可能抓不到明確的方案價格
    let sourcePlans: SourcePlan[] = [];
    if (sourceUrl) {
      console.log("Scraping plans from:", sourceUrl);
      sourcePlans = await scrapePlansFromUrl(sourceUrl);
      console.log("Scraped plans:", sourcePlans.length);
    }

    // 搜尋 YouTube 影片（若啟用）
    let youtubeVideos: YoutubeVideo[] = [];
    let youtubeError: string | undefined;
    if (includeYoutube) {
      const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY") || Deno.env.get("GOOGLE_API_KEY") || "";
      if (!YOUTUBE_API_KEY) {
        youtubeError = "YouTube API key 尚未設定（YOUTUBE_API_KEY / GOOGLE_API_KEY）";
        console.warn("YouTube API key not configured (YOUTUBE_API_KEY / GOOGLE_API_KEY). Skipping YouTube embeds.");
      } else {
        // 解析頻道 ID（若有提供）
        const parsedChannelId = extractChannelId(youtubeChannelId);
        if (youtubeChannelId && !parsedChannelId) {
          youtubeError = "無法解析 YouTube 頻道 ID。請使用頻道 ID（UC 開頭）或頻道網址（youtube.com/channel/UCxxxxxx）。@username 格式暫不支援。";
          console.warn("Invalid YouTube channel ID format:", youtubeChannelId);
        } else {
          const query = `${topic} ${keywords}`.trim();
          const yt = await searchYoutubeVideos({
            apiKey: YOUTUBE_API_KEY,
            query,
            maxResults: 2,
            regionCode: language === "zh-TW" ? "TW" : undefined,
            relevanceLanguage: language === "zh-TW" ? "zh-Hant" : undefined,
            channelId: parsedChannelId || undefined,
          });
          youtubeVideos = yt.videos;
          youtubeError = yt.error;
          console.log("YouTube videos found:", youtubeVideos.length, parsedChannelId ? `(channel: ${parsedChannelId})` : "(all channels)");
        }
      }
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

  3. 【比較分析章節】- 必須包含表格${scrapedImages.length > 0 ? '（含產品圖片）' : ''}${sourcePlans.length > 0 ? '（方案/價格以來源網址為準）' : ''}
     <h2>主要方案/產品比較分析</h2>
     <p>說明本段落會從功能、成本、效能與適用情境比較不同方案，協助讀者快速做決策。</p>
     
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
         <!-- 產生 4 列比較資料：每一格都要填入具體內容；禁止使用「...」、TBD、或任何佔位文字 -->
         ${sourcePlans.length > 0 ? `<!-- 【來源網址擷取到的方案/價格】請「優先」使用下列資料，並確保表格中的「方案/產品」與「參考價格」對應一致（不可憑空捏造）：\n${sourcePlans.map((p, i) => `${i + 1}. ${p.name}｜${p.priceText}`).join('\\n')}\n若不足 4 列，剩餘列可以列出同品牌的其他方案/分類，但「參考價格」請填「請見官網」。 -->` : ''}
         ${scrapedImages.length > 0 ? `<!-- 第一欄請用 <img>，圖片 URL 依序使用：${scrapedImages.map((img, i) => `(${i + 1}) ${img}`).join('、')} -->` : ''}
       </tbody>
     </table>
     <p>最後用一段話總結差異與建議選擇方向。</p>
     ${scrapedImages.length > 0 ? `
     【重要】若要插入圖片，以下是可用的圖片 URL：
     ${scrapedImages.map((img, i) => `圖片${i + 1}: ${img}`).join('\n   ')}
     ` : ''}

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
 - 不要輸出「...」(三個點) 這類佔位符
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

    let cleaned = sanitize(generatedText || '');

    // 若啟用 YouTube，將影片區塊插入到文章前段（第二個段落後）
    if (includeYoutube && youtubeVideos.length > 0) {
      const youtubeSection = buildYoutubeSection(topic, youtubeVideos);
      cleaned = insertAfterSecondParagraph(cleaned, youtubeSection);
    }

    // 計算實際字數（去除 HTML 標籤）
    const visibleText = cleaned
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const condensed = visibleText.replace(/\s+/g, '');
    const actualWordCount = condensed.length;
    const cjkCount = (visibleText.match(/[\u4E00-\u9FFF]/g) || []).length;

    return new Response(
      JSON.stringify({
        generatedText: cleaned,
        provider,
        wordCount: actualWordCount,
        cjkCount,
        targetWordCount: wordCount,
        youtubeCount: youtubeVideos.length,
        youtubeError: youtubeError ?? null,
        sourcePlansCount: sourcePlans.length,
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
