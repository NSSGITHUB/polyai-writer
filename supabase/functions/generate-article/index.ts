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

    const prompt = `【重要：字數要求】請以${language}撰寫一篇完整的 SEO 文章，主題為：「${topic}」。\n\n` +
      `【關鍵要求】文章總字數必須達到 ${wordCount} 字，這是最低要求，不可少於此字數！\n` +
      `請注意：${wordCount} 字是必須達到的最低字數，請確保文章內容充實到足以達到此字數要求。\n\n` +
      `【風格要求】文章風格為「${style}」。\n\n` +
      (keywords ? `【關鍵字】請自然融入以下關鍵字（勿堆疊）：${keywords}\n\n` : "") +
      (outline ? `【大綱參考】可依照此大綱調整結構：\n${outline}\n\n` : "") +
      `【內容要求】\n` +
      `1. 文章結構：開頭引言、多個主體段落（每段200-400字）、結尾總結\n` +
      `2. 內容深度：每個要點都要充分展開說明，提供具體事例、數據、案例和詳細解釋\n` +
      `3. 段落安排：根據字數要求調整段落數量，確保每段都有實質內容\n` +
      `   - 1000字以下：至少5段\n` +
      `   - 2000-4000字：至少8-10段\n` +
      `   - 5000字以上：至少12-15段\n` +
      `4. 開頭段落：清楚說明文章主題和重點（200-300字）\n` +
      `5. 結尾段落：提供完整總結與明確的行動呼籲（200-300字）\n` +
      `6. 語氣風格：自然流暢、易於閱讀、避免重複贅詞\n` +
      `7. 格式要求：使用純文字格式，不要使用 Markdown 符號如 #、*、-、[]、** 等\n` +
      `8. 內容充實：避免空泛陳述，每個觀點都要有充分的說明、例證和詳細闡述\n` +
      `9. 字數檢查：寫作時請持續確認字數，確保最終達到 ${wordCount} 字的要求\n\n` +
      `【最後強調】文章必須達到 ${wordCount} 字，這是強制要求。請寫得詳細充實，不要過於簡短或概括。`;

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
          model: "gpt-5-2025-08-07",
          messages: [
            { role: "system", content: "You are a professional SEO content writer. Always write complete articles that meet the exact word count requirements." },
            { role: "user", content: prompt },
          ],
          max_completion_tokens: Math.min(Math.ceil(wordCount * 4), 16000),
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
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GOOGLE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: Math.ceil(wordCount * 4),
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

    return new Response(
      JSON.stringify({ generatedText, provider }),
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