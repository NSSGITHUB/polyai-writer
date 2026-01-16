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

type SourcePlan = { name: string; priceText: string; source: "jsonld" | "text"; currency: string; numericPrice: number };

type YoutubeVideo = { title: string; videoId: string; url: string };
type YoutubeSearchResult = { videos: YoutubeVideo[]; error?: string; status?: number };

const escapeHtmlAttr = (s: string) =>
  (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// 貨幣優先順序：TWD > JPY > USD > 其他
const CURRENCY_PRIORITY: Record<string, number> = {
  "TWD": 1, "NTD": 1,
  "JPY": 2,
  "USD": 3,
  "HKD": 4,
  "CNY": 5,
  "EUR": 6,
};

function detectCurrency(symbol: string, text?: string): string {
  // 檢查上下文是否有台灣相關字詞
  const hasTaiwanContext = text && /(台灣|臺灣|tw|taiwan|新台幣|台幣)/i.test(text);
  
  if (symbol === "NT$" || symbol === "NTD") return "TWD";
  if (symbol === "$") {
    // 優先判斷是否為台幣
    if (hasTaiwanContext) return "TWD";
    return "USD";
  }
  if (symbol === "¥") {
    // 優先檢查是否為台幣（有些網站用 ¥ 但實際是台幣）
    if (hasTaiwanContext) return "TWD";
    // 嘗試從上下文判斷是日幣還是人民幣
    if (text && /(日本|日幣|円|yen|jp)/i.test(text)) return "JPY";
    if (text && /(人民幣|中國|rmb|cny|cn)/i.test(text)) return "CNY";
    // 預設為台幣（因為系統以台幣優先）
    return "TWD";
  }
  if (symbol === "HK$") return "HKD";
  if (symbol === "€") return "EUR";
  return "TWD"; // 預設為台幣
}

function formatPriceText(price: unknown, currency: unknown): { text: string; currency: string; numericPrice: number } | null {
  const p = typeof price === "number" ? String(price) : typeof price === "string" ? price.trim() : "";
  if (!p) return null;

  const c = typeof currency === "string" ? currency.trim().toUpperCase() : "";
  // 預設為台幣
  const currencyCode = c || "TWD";
  const prefix =
    currencyCode === "TWD" || currencyCode === "NTD" ? "NT$" :
    currencyCode === "USD" ? "$" :
    currencyCode === "HKD" ? "HK$" :
    currencyCode === "JPY" ? "¥" :
    currencyCode === "CNY" ? "¥" :
    currencyCode === "EUR" ? "€" :
    "NT$"; // 預設使用台幣符號

  const numericPrice = parseFloat(p.replace(/[,，]/g, '')) || 0;

  // Preserve existing prefix if the price string already has it
  if (/^(NT\$|HK\$|\$|¥|€)/.test(p)) return { text: p, currency: currencyCode, numericPrice };
  return { text: `${prefix}${p}`.trim(), currency: currencyCode, numericPrice };
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
              plans.push({ name, priceText: "請見官網", source: "jsonld", currency: "OTHER", numericPrice: 0 });
              continue;
            }

            for (const off of offerList) {
              const price = off?.price ?? off?.lowPrice ?? off?.highPrice;
              const currency = off?.priceCurrency;
              const result = formatPriceText(price, currency);
              if (result) {
                plans.push({ name, priceText: result.text, source: "jsonld", currency: result.currency, numericPrice: result.numericPrice });
              } else {
                plans.push({ name, priceText: "請見官網", source: "jsonld", currency: "OTHER", numericPrice: 0 });
              }
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

    // ====== 特別處理主機類網站的價格對照 ======
    // 先從文本中尋找常見的主機方案名稱關鍵字
    const planTypeKeywords = [
      { pattern: /(經濟型|基本型|入門|starter|basic|economy)/i, name: "經濟型主機" },
      { pattern: /(商務型|進階|business|professional|pro)/i, name: "商務型主機" },
      { pattern: /(旗艦型|企業型|premium|enterprise|ultimate)/i, name: "旗艦型主機" },
      { pattern: /(標準型|standard)/i, name: "標準型主機" },
    ];

    // 找出所有 NT$ 價格及其周邊上下文（擴大範圍）
    const priceContextRegex = /(.{0,100}?)(NT\$|NTD)\s*([0-9][0-9,]*(?:\.[0-9]+)?)(.{0,50}?)/gi;
    const foundPrices: Array<{name: string; priceText: string; numericPrice: number; currency: string}> = [];
    
    let pMatch: RegExpExecArray | null;
    while ((pMatch = priceContextRegex.exec(text)) !== null) {
      const before = (pMatch[1] || "").trim();
      const num = pMatch[3] || "";
      const after = (pMatch[4] || "").trim();
      const numericPrice = parseFloat(num.replace(/[,，]/g, '')) || 0;
      const fullContext = `${before} ${after}`;
      
      // 跳過月費
      if (/\/月|月費|每月|\/mo/i.test(fullContext)) continue;
      // 跳過太小的金額（可能是附加費用）
      if (numericPrice < 1000) continue;

      // 嘗試從上下文中匹配方案類型
      let matchedName = "";
      for (const kw of planTypeKeywords) {
        if (kw.pattern.test(fullContext)) {
          matchedName = kw.name;
          break;
        }
      }

      // 如果沒匹配到，使用原本的前綴提取邏輯
      if (!matchedName) {
        matchedName = before.replace(/[|｜:：•·]/g, " ").replace(/\s+/g, " ").trim();
        if (matchedName.length > 40) matchedName = matchedName.slice(-40).trim();
        // 再次嘗試提取有意義的名稱（找最後一個中文詞組）
        const chineseMatch = matchedName.match(/([\u4E00-\u9FFF]+[型主機方案]+)/);
        if (chineseMatch) {
          matchedName = chineseMatch[1];
        }
      }

      if (!matchedName || !/[\u4E00-\u9FFFA-Za-z]/.test(matchedName)) continue;

      foundPrices.push({ 
        name: matchedName, 
        priceText: `NT$${num}`, 
        numericPrice, 
        currency: "TWD" 
      });
    }

    // 再用「數字+元」格式
    const yuanRegex = /(.{0,80}?)([0-9][0-9,]+)\s*元(?:\/年|年)?/gi;
    while ((pMatch = yuanRegex.exec(text)) !== null) {
      const before = (pMatch[1] || "").trim();
      const num = pMatch[2] || "";
      const numericPrice = parseFloat(num.replace(/[,，]/g, '')) || 0;
      
      // 跳過月費
      if (before.includes('/月') || before.includes('月費') || before.includes('每月')) continue;
      // 跳過太小的金額
      if (numericPrice < 1000) continue;
      
      // 嘗試匹配方案類型
      let matchedName = "";
      for (const kw of planTypeKeywords) {
        if (kw.pattern.test(before)) {
          matchedName = kw.name;
          break;
        }
      }

      if (!matchedName) {
        matchedName = before.replace(/[|｜:：•·]/g, " ").replace(/\s+/g, " ").trim();
        if (matchedName.length > 40) matchedName = matchedName.slice(-40).trim();
      }
      
      if (!matchedName || !/[\u4E00-\u9FFFA-Za-z]/.test(matchedName)) continue;

      foundPrices.push({ name: matchedName, priceText: `NT$${num}`, numericPrice, currency: "TWD" });
    }

    // ====== 去重複並按價格排序，確保名稱正確對應 ======
    // 按價格排序後重新分配名稱（針對同類主機網站）
    const sortedByPrice = [...foundPrices].sort((a, b) => a.numericPrice - b.numericPrice);
    
    // 如果有3個價格且看起來是主機方案（3600, 5400, 26500 這種階梯），重新命名
    if (sortedByPrice.length >= 3) {
      const prices = sortedByPrice.map(p => p.numericPrice);
      // 檢查是否為階梯式價格（每個比前一個大）
      const isStaircase = prices.every((p, i) => i === 0 || p > prices[i-1]);
      
      if (isStaircase && prices[0] >= 1000 && prices[0] <= 10000) {
        // 看起來是主機方案，按照經濟<商務<旗艦命名
        const planNames = ["經濟型主機", "商務型主機", "旗艦型主機"];
        sortedByPrice.slice(0, 3).forEach((p, i) => {
          if (planNames[i]) {
            p.name = planNames[i];
          }
        });
      }
    }

    // 將找到的價格加入 plans
    for (const fp of sortedByPrice) {
      plans.push({ name: fp.name, priceText: fp.priceText, source: "text", currency: fp.currency, numericPrice: fp.numericPrice });
      if (plans.length >= 20) break;
    }

    // 按貨幣優先順序排序：TWD > JPY > USD > 其他
    plans.sort((a, b) => {
      const priorityA = CURRENCY_PRIORITY[a.currency] || 99;
      const priorityB = CURRENCY_PRIORITY[b.currency] || 99;
      return priorityA - priorityB;
    });

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

    console.log("Scraped plans with currencies:", uniq.map(p => `${p.name}: ${p.priceText} (${p.currency})`));

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

// 計算中文字數
function calculateChineseWordCount(html: string): number {
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/gi, ' ').replace(/\s+/g, '');
  return text.length;
}

// 計算關鍵字出現次數
function countKeywordOccurrences(html: string, keyword: string): number {
  if (!keyword) return 0;
  const text = html.replace(/<[^>]*>/g, '');
  const regex = new RegExp(keyword, 'gi');
  return (text.match(regex) || []).length;
}

// 內文淨化：清理 HTML 輸出
function sanitizeHtml(text: string): string {
  return text
    .replace(/^```html\s*/gi, '')
    .replace(/^```\s*/gm, '')
    .replace(/```$/gm, '')
    .replace(/^\s*(好的，?這是一篇|好的，這是|以下是|根據您的要求|如您所需|符合您要求|我將為您|我會為您|Here is|Here's|I've created|I have created).*/im, '')
    .replace(/^.*(字數|200\s*[–-]\s*300\s*字|3000\s*字|±10%).*$/gim, '')
    .replace(/^.*(回應內容|回覆內容|生成內容|以下內容).*$/gim, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// 分段生成的章節定義
interface SectionConfig {
  title: string;
  type: 'intro' | 'content' | 'comparison' | 'guide' | 'faq' | 'conclusion';
  minWords: number;
  minKeywordCount: number;
}

// 呼叫 AI API
async function callAI(
  provider: string,
  prompt: string,
  systemPrompt: string,
  maxTokens: number
): Promise<string> {
  let generatedText = "";

  if (provider === "openai") {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI error:", error);
      throw new Error("OpenAI API error");
    }

    const data = await response.json();
    generatedText = data.choices?.[0]?.message?.content ?? "";
  } else if (provider === "google") {
    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
    if (!GOOGLE_API_KEY) throw new Error("GOOGLE_API_KEY not configured");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: maxTokens,
          },
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          }
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google error:", errorText);
      throw new Error("Google API error");
    }

    const data = await response.json();
    generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } else if (provider === "anthropic") {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic error:", error);
      throw new Error("Anthropic API error");
    }

    const data = await response.json();
    generatedText = data.content?.[0]?.text ?? "";
  } else if (provider === "xai") {
    const XAI_API_KEY = Deno.env.get("XAI_API_KEY");
    if (!XAI_API_KEY) throw new Error("XAI_API_KEY not configured");

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${XAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        max_tokens: maxTokens,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("xAI error:", error);
      throw new Error("xAI API error");
    }

    const data = await response.json();
    generatedText = data.choices?.[0]?.message?.content ?? "";
  }

  return sanitizeHtml(generatedText);
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
      wordCount = 5000,
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
    let sourcePlans: SourcePlan[] = [];
    if (sourceUrl) {
      console.log("Scraping plans from:", sourceUrl);
      sourcePlans = await scrapePlansFromUrl(sourceUrl);
      console.log("Scraped plans:", sourcePlans.length);
    }

    // 決定價格顯示的主要貨幣（根據抓取到的資料）
    const primaryCurrency = sourcePlans.length > 0 ? sourcePlans[0].currency : "TWD";
    console.log("Primary currency:", primaryCurrency);

    // 搜尋 YouTube 影片（若啟用）
    let youtubeVideos: YoutubeVideo[] = [];
    let youtubeError: string | undefined;
    if (includeYoutube) {
      const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY") || Deno.env.get("GOOGLE_API_KEY") || "";
      if (!YOUTUBE_API_KEY) {
        youtubeError = "YouTube API key 尚未設定（YOUTUBE_API_KEY / GOOGLE_API_KEY）";
        console.warn("YouTube API key not configured (YOUTUBE_API_KEY / GOOGLE_API_KEY). Skipping YouTube embeds.");
      } else {
      const parsedChannelId = extractChannelId(youtubeChannelId);
        if (youtubeChannelId && !parsedChannelId) {
          youtubeError = "無法解析 YouTube 頻道 ID。請使用頻道 ID（UC 開頭）或頻道網址（youtube.com/channel/UCxxxxxx）。@username 格式暫不支援。";
          console.warn("Invalid YouTube channel ID format:", youtubeChannelId);
        } else {
          // 只使用第一組關鍵字搜尋 YouTube 影片
          const keywordList = keywords ? keywords.split(/[,，、\n]+/).map(k => k.trim()).filter(Boolean) : [];
          const firstKeyword = keywordList.length > 0 ? keywordList[0] : "";
          const query = firstKeyword ? `${topic} ${firstKeyword}`.trim() : topic;
          console.log("YouTube search query (first keyword only):", query);
          
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
    const todayDate = new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' });

    // 系統提示詞 - 加入文字樣式指引
    const systemPrompt = `你是一位頂尖的 SEO 內容專家與專業作家。請輸出純 HTML 格式的長篇深度文章（使用 <h2>、<h3>、<p>、<table>、<ul>、<blockquote> 等標籤）。文章必須專業、詳盡、有深度。

【文字樣式要求 - 增加可讀性】
- 重要關鍵詞、專有名詞使用 <strong style="color:#2563eb;">關鍵詞</strong> 標記（藍色粗體）
- 數據、價格、百分比使用 <span style="color:#dc2626;font-weight:600;">數據</span> 標記（紅色粗體）
- 提示、建議使用 <span style="color:#059669;">提示內容</span> 標記（綠色）
- 每段落的開頭關鍵概念用 <strong>粗體</strong> 強調
- 列表項目的標題使用 <strong>標題：</strong> 格式
- 重要提醒可用 <mark style="background:#fef3c7;padding:2px 4px;">重點標記</mark>

【絕對禁止】
- 不要輸出任何 Markdown 格式（# * - ** [] 等）
- 不要輸出 \`\`\`html 或 \`\`\` 標記
- 不要有「以下是...」「好的，這是...」等 AI 開場白
- 不要使用「...」(三個點) 這類佔位符
- 不要使用 TBD、Lorem ipsum 或任何佔位文字

直接輸出乾淨的 HTML body 內容。`;

    // ============ 分段生成文章 ============
    console.log("Starting segmented article generation for:", topic);
    
    // 定義各章節
    const sections: SectionConfig[] = [
      { title: "前言與市場概況", type: "intro", minWords: 300, minKeywordCount: 2 },
      { title: `${currentYear}年關鍵趨勢分析`, type: "content", minWords: 500, minKeywordCount: 3 },
      { title: "核心功能與技術解析", type: "content", minWords: 500, minKeywordCount: 3 },
      { title: "熱門產品詳細比較", type: "comparison", minWords: 600, minKeywordCount: 2 },
      { title: "實戰操作教學指南", type: "guide", minWords: 500, minKeywordCount: 3 },
      { title: "專家進階技巧", type: "content", minWords: 400, minKeywordCount: 2 },
      { title: "成功案例分享", type: "content", minWords: 400, minKeywordCount: 2 },
      { title: "常見問題", type: "faq", minWords: 600, minKeywordCount: 4 },
      { title: "結論與建議", type: "conclusion", minWords: 300, minKeywordCount: 2 },
    ];

    let fullArticleContent = "";
    let totalWordCount = 0;
    let totalKeywordCount = 0;

    // 逐段生成
    for (const section of sections) {
      console.log(`Generating section: ${section.title}...`);

      let sectionPrompt = "";

      // 根據章節類型構建不同的提示詞
      if (section.type === "intro") {
        sectionPrompt = `
撰寫「${section.title}」章節，主題：「${topic}」

【格式要求】
<h2>${section.title}：${topic}完整指南 ${currentYear}</h2>
<p>開場段落，用痛點問題或場景開場...</p>
<p>描述讀者面臨的挑戰...</p>
<p>預告本文將帶來的價值...</p>

【內容要求】
- 字數：至少 ${section.minWords} 字
- 關鍵字「${topic}」至少出現 ${section.minKeywordCount} 次
- 包含具體數據或趨勢
- 3-4 個段落

${keywords ? `相關關鍵字：${keywords}` : ''}
${targetAudience ? `目標受眾：${targetAudience}` : ''}
`;
      } else if (section.type === "comparison") {
        // 準備價格資訊 - 強調使用實際價格
        const priceInfo = sourcePlans.length > 0 
          ? sourcePlans.map((p, i) => `${i + 1}. ${p.name}：${p.priceText}（這是實際價格，請直接使用）`).join('\n')
          : '請根據主題研究並填入真實的市場價格';

        const currencyNote = primaryCurrency === "TWD" ? "以新台幣（NT$）顯示價格" :
                            primaryCurrency === "JPY" ? "以日圓（¥）顯示價格" :
                            primaryCurrency === "USD" ? "以美金（$）顯示價格" :
                            "以來源網頁的貨幣顯示價格";

        sectionPrompt = `
撰寫「${section.title}」章節，主題：「${topic}」

【格式要求】
<h2>${section.title}</h2>
<p>說明本段落會從功能、成本、效能與適用情境比較不同方案，協助讀者快速做決策。</p>

<table style="width:100%;border-collapse:collapse;border:2px solid #dee2e6;margin:1.5rem 0;font-size:0.95rem;">
  <thead>
    <tr style="background-color:#1e40af;color:white;">
      ${scrapedImages.length > 0 ? '<th style="width:130px;padding:12px;border:1px solid #dee2e6;text-align:left;font-weight:600;">產品圖片</th>' : ''}
      <th style="padding:12px;border:1px solid #dee2e6;text-align:left;font-weight:600;">方案/產品</th>
      <th style="padding:12px;border:1px solid #dee2e6;text-align:left;font-weight:600;">核心特色</th>
      <th style="padding:12px;border:1px solid #dee2e6;text-align:left;font-weight:600;">優點</th>
      <th style="padding:12px;border:1px solid #dee2e6;text-align:left;font-weight:600;">缺點</th>
      <th style="padding:12px;border:1px solid #dee2e6;text-align:left;font-weight:600;">適合對象</th>
      <th style="padding:12px;border:1px solid #dee2e6;text-align:left;font-weight:600;">參考價格</th>
    </tr>
  </thead>
  <tbody>
    <!-- 產生 4-6 列比較資料，奇偶行交替背景色 -->
    <tr style="background-color:#ffffff;">...</tr>
    <tr style="background-color:#f8fafc;">...</tr>
  </tbody>
</table>

<p>總結差異與建議選擇方向。</p>

【重要規則 - 價格必須正確！】
- 價格欄使用 <span style="color:#dc2626;font-weight:700;">NT$價格</span> 格式顯示（紅色粗體）
- ⚠️ 價格必須使用下方「價格資料來源」的實際金額，不要自行計算或轉換！
- 如果來源是年費 NT$3,600，就顯示 NT$3,600/年，不要換算成月費！
- 每個 <td> 必須包含 style="padding:10px;border:1px solid #dee2e6;vertical-align:middle;"
- 奇數行背景色：#ffffff，偶數行背景色：#f8fafc
- 字數：至少 ${section.minWords} 字
- 關鍵字「${topic}」至少出現 ${section.minKeywordCount} 次
- ${currencyNote}
- 每格都要填入具體內容，禁止使用「...」、TBD

【價格資料來源 - 必須使用這些實際價格！】
${priceInfo}

${scrapedImages.length > 0 ? `【圖片欄格式】
<td style="padding:10px;border:1px solid #dee2e6;vertical-align:middle;text-align:center;"><img src="圖片URL" alt="產品名稱" style="max-width:120px;max-height:100px;width:auto;height:auto;object-fit:contain;"></td>

可用的圖片 URL：
${scrapedImages.map((img, i) => `(${i + 1}) ${img}`).join('\n')}` : ''}
`;
      } else if (section.type === "guide") {
        sectionPrompt = `
撰寫「${section.title}」章節，主題：「${topic}」

【格式要求】
<h2>${section.title}</h2>
<p>介紹本節目的...</p>

<h3>第一步：評估與規劃</h3>
<p>詳細說明...</p>
<ul>
  <li><strong>重點項目：</strong>詳細說明</li>
</ul>

<h3>第二步：執行與實作</h3>
<p>詳細說明...</p>

<h3>第三步：監測與優化</h3>
<p>詳細說明...</p>

<h3>💡 專家建議</h3>
<blockquote>
  <p>分享業界內幕或進階技巧...</p>
</blockquote>

【內容要求】
- 字數：至少 ${section.minWords} 字
- 關鍵字「${topic}」至少出現 ${section.minKeywordCount} 次
- 每個步驟都要有詳細的操作說明
- 包含實用的小技巧

${keywords ? `相關關鍵字：${keywords}` : ''}
`;
      } else if (section.type === "faq") {
        sectionPrompt = `
撰寫「${section.title}」章節，主題：「${topic}」

【格式要求】
<h2>${topic} 常見問題</h2>

<h3>問題 1：${topic}是什麼？</h3>
<p>詳細回答，至少 60 字...</p>

<h3>問題 2：如何選擇適合的${topic}？</h3>
<p>詳細回答...</p>

<h3>問題 3：${topic}的價格範圍是多少？</h3>
<p>詳細回答...</p>

（繼續 5-8 個 FAQ）

【內容要求】
- 產生 6-8 個常見問題
- 字數：至少 ${section.minWords} 字
- 關鍵字「${topic}」至少出現 ${section.minKeywordCount} 次
- 每個回答至少 60 字，提供實用資訊
- 問題要涵蓋：定義、選擇、價格、使用、比較、注意事項等面向

${keywords ? `相關關鍵字：${keywords}` : ''}
`;
      } else if (section.type === "conclusion") {
        sectionPrompt = `
撰寫「${section.title}」章節，主題：「${topic}」

【格式要求】
<h2>結論：立即行動，掌握 ${topic} 的優勢</h2>
<p>總結文章重點...</p>
<p>提供具體的下一步行動建議...</p>
<p>鼓勵讀者採取行動...</p>

【內容要求】
- 字數：至少 ${section.minWords} 字
- 關鍵字「${topic}」至少出現 ${section.minKeywordCount} 次
- 總結文章中提到的關鍵要點
- 給出明確的行動呼籲

${keywords ? `相關關鍵字：${keywords}` : ''}
`;
      } else {
        // content type
        sectionPrompt = `
撰寫「${section.title}」章節，主題：「${topic}」

【格式要求】
<h2>${section.title}</h2>
<p>開場段落，說明本節重點...</p>

<h3>子標題 1</h3>
<p>詳細說明，包含具體例子和數據...</p>
<ul>
  <li><strong>重點項目：</strong>詳細說明</li>
  <li><strong>重點項目：</strong>詳細說明</li>
</ul>

<h3>子標題 2</h3>
<p>進一步分析...</p>

<h3>子標題 3</h3>
<p>補充說明...</p>

【內容要求】
- 字數：至少 ${section.minWords} 字
- 關鍵字「${topic}」至少出現 ${section.minKeywordCount} 次
- 包含 2-3 個 h3 子標題
- 每個子標題下至少 2 個段落
- 使用列表整理重點

${keywords ? `相關關鍵字：${keywords}` : ''}
${targetAudience ? `目標受眾：${targetAudience}` : ''}
${section.title.includes('趨勢') ? `當前年份：${currentYear}` : ''}
`;
      }

      // 呼叫 AI 生成此章節
      const maxTokens = Math.ceil(section.minWords * 3);
      const sectionContent = await callAI(provider, sectionPrompt, systemPrompt, maxTokens);

      // 計算此章節的字數和關鍵字次數
      const sectionWordCount = calculateChineseWordCount(sectionContent);
      const sectionKeywordCount = countKeywordOccurrences(sectionContent, topic);

      console.log(`Section "${section.title}" - Words: ${sectionWordCount}, Keywords: ${sectionKeywordCount}`);

      fullArticleContent += sectionContent + "\n\n";
      totalWordCount += sectionWordCount;
      totalKeywordCount += sectionKeywordCount;
    }

    // 若啟用 YouTube，將影片區塊插入到文章前段
    if (includeYoutube && youtubeVideos.length > 0) {
      const youtubeSection = buildYoutubeSection(topic, youtubeVideos);
      fullArticleContent = insertAfterSecondParagraph(fullArticleContent, youtubeSection);
    }

    // 計算最終字數
    const finalWordCount = calculateChineseWordCount(fullArticleContent);
    const finalKeywordCount = countKeywordOccurrences(fullArticleContent, topic);
    
    // 計算中日韓字符數
    const visibleText = fullArticleContent
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const cjkCount = (visibleText.match(/[\u4E00-\u9FFF]/g) || []).length;

    console.log(`Article generation complete. Total words: ${finalWordCount}, Keywords: ${finalKeywordCount}`);

    return new Response(
      JSON.stringify({
        generatedText: fullArticleContent,
        provider,
        wordCount: finalWordCount,
        cjkCount,
        targetWordCount: wordCount,
        keywordCount: finalKeywordCount,
        youtubeCount: youtubeVideos.length,
        youtubeError: youtubeError ?? null,
        sourcePlansCount: sourcePlans.length,
        primaryCurrency,
        sectionsGenerated: sections.length,
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
