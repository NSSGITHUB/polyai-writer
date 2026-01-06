import { useMemo } from "react";

export function HtmlContent({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const sanitized = useMemo(() => {
    const raw = (html ?? "").toString();
    if (!raw.trim()) return "";

    // Strip common markdown code fences around HTML
    let normalized = raw
      .replace(/```\s*html\s*/gi, "")
      .replace(/```/g, "")
      .trim();

    const hasHtmlTags = (s: string) => /<\s*[a-zA-Z][\s\S]*?>/.test(s);

    const decodeEntities = (s: string) => {
      try {
        const decodedDoc = new DOMParser().parseFromString(s, "text/html");
        return (decodedDoc.documentElement.textContent || s).trim();
      } catch {
        return s;
      }
    };

    const unwrapPreCode = (s: string) => {
      if (!hasHtmlTags(s)) return s;
      try {
        const doc = new DOMParser().parseFromString(s, "text/html");
        const body = doc.body;
        if (body.children.length !== 1) return s;

        const only = body.firstElementChild;
        if (!only) return s;

        if (only.tagName === "PRE") {
          const code = only.querySelector("code");
          const text = (code ?? only).textContent?.trim();
          if (text && (text.includes("<") || text.includes("&lt;") || text.includes("&amp;lt;"))) {
            return text;
          }
        }
      } catch {
        // ignore
      }
      return s;
    };

    // Handle content that arrives wrapped as <pre><code>...</code></pre>
    normalized = unwrapPreCode(normalized);

    // If the HTML has been entity-escaped (e.g. &lt;h2&gt; or even &amp;lt;h2&amp;gt;), decode it back.
    for (let i = 0; i < 3; i++) {
      const containsTagMarkup = hasHtmlTags(normalized);
      if (containsTagMarkup) break;

      const looksEntityEscaped =
        /&(lt|gt|amp|quot|#\d+);/i.test(normalized) &&
        (normalized.includes("&lt;") || normalized.includes("&amp;lt;") || normalized.includes("&gt;") || normalized.includes("&amp;gt;"));

      if (!looksEntityEscaped) break;

      const decoded = decodeEntities(normalized);
      if (decoded === normalized) break;
      normalized = decoded;
    }

    // If it's still plain text, preserve line breaks safely.
    const isStillPlainText = !hasHtmlTags(normalized);
    if (isStillPlainText) {
      const escDoc = new DOMParser().parseFromString("", "text/html");
      const div = escDoc.createElement("div");
      div.textContent = normalized;
      return div.innerHTML.replace(/\n/g, "<br/>");
    }

    // Minimal sanitization: remove active content + inline event handlers.
    try {
      const doc = new DOMParser().parseFromString(normalized, "text/html");
      const blockedTags = ["script", "iframe", "object", "embed", "link", "meta", "style"];
      for (const tag of blockedTags) {
        doc.querySelectorAll(tag).forEach((el) => el.remove());
      }

      doc.querySelectorAll("*").forEach((el) => {
        Array.from(el.attributes).forEach((attr) => {
          const name = attr.name.toLowerCase();
          const value = (attr.value || "").trim().toLowerCase();

          if (name.startsWith("on") || name === "srcdoc") {
            el.removeAttribute(attr.name);
            return;
          }

          if ((name === "href" || name === "src") && value.startsWith("javascript:")) {
            el.removeAttribute(attr.name);
          }
        });
      });

      return doc.body.innerHTML;
    } catch {
      return normalized;
    }
  }, [html]);

  return <div className={className} dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
