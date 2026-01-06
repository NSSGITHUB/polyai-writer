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

    // If the HTML has been entity-escaped (e.g. &lt;h2&gt;), decode it back.
    const containsTagMarkup = /<\s*[a-zA-Z][\s\S]*?>/.test(normalized);
    const looksEntityEscaped = normalized.includes("&lt;") && !containsTagMarkup;
    if (looksEntityEscaped && typeof window !== "undefined") {
      try {
        const decodedDoc = new DOMParser().parseFromString(normalized, "text/html");
        normalized = decodedDoc.documentElement.textContent || normalized;
      } catch {
        // ignore
      }
    }

    // If it's still plain text, preserve line breaks safely.
    const isStillPlainText = !/<\s*[a-zA-Z][\s\S]*?>/.test(normalized);
    if (isStillPlainText) {
      const escDoc = new DOMParser().parseFromString("", "text/html");
      const div = escDoc.createElement("div");
      div.textContent = normalized;
      return div.innerHTML.replace(/\n/g, "<br/>");
    }

    // Minimal sanitization: remove active content + inline event handlers.
    try {
      const doc = new DOMParser().parseFromString(normalized, "text/html");
      const blockedTags = [
        "script",
        "iframe",
        "object",
        "embed",
        "link",
        "meta",
        "style",
      ];
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
