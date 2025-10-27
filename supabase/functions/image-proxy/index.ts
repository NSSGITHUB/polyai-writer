import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { searchParams } = new URL(req.url);
    let url = searchParams.get("url") || "";

    if (!url) {
      return new Response(JSON.stringify({ error: "Missing url parameter" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Support relative paths coming from the PHP API (e.g. /uploads/images/xxx.png)
    if (!url.startsWith("http") && !url.startsWith("data:")) {
      url = `https://autowriter.ai.com.tw${url}`;
    }

    // If it's already a data URL, just echo it back as PNG
    if (url.startsWith("data:")) {
      const base64 = url.split(",", 2)[1] || "";
      const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      return new Response(binary, {
        headers: { ...corsHeaders, "Content-Type": "image/png" },
      });
    }

    const upstream = await fetch(url, {
      // Some image hosts require a Referer/User-Agent
      headers: {
        "Referer": "https://autowriter.ai.com.tw/",
        "User-Agent": "Lovable-Image-Proxy/1.0 (+https://lovable.dev)",
      },
    });

    if (!upstream.ok || !upstream.body) {
      const text = await upstream.text().catch(() => "");
      console.error("image-proxy upstream error", upstream.status, text);
      return new Response(JSON.stringify({ error: "Failed to fetch image" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ct = upstream.headers.get("content-type") || "image/png";
    const buf = await upstream.arrayBuffer();
    return new Response(buf, {
      headers: { ...corsHeaders, "Content-Type": ct },
    });
  } catch (e) {
    console.error("image-proxy error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});