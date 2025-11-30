import React from "react";
import { sanitizeHtml } from "@/lib/email/sanitizer";

interface HtmlEmailContentProps {
  content: string;
  className?: string;
}

export const HtmlEmailContent: React.FC<HtmlEmailContentProps> = ({
  content,
  className,
}) => {
  const sanitizedContent = sanitizeHtml(content);

  // Inject system font stack (San Francisco on Mac)
  const fontStyle = `
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol" !important;
      }
    </style>
  `;

  const finalContent = fontStyle + sanitizedContent;

  console.log("[HtmlEmailContent] Sanitized length:", sanitizedContent.length);

  return (
    <iframe
      srcDoc={finalContent}
      className={`w-full min-h-[500px] border-0 ${className}`}
      sandbox="allow-same-origin"
      title="Email content"
      style={{ display: "block" }}
    />
  );
};
