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
        color: #e4e4e7 !important; /* Zinc-200 for better readability */
        background-color: transparent !important;
        word-wrap: break-word;
      }
      /* Force text color on common elements */
      p, h1, h2, h3, h4, h5, h6, span, div, td, th, li {
        color: #e4e4e7 !important;
      }
      /* Make links visible */
      a {
        color: #a855f7 !important; /* Purple-500 */
      }
      /* Reset backgrounds to avoid white boxes */
      .bg-white, .bg-light {
        background-color: transparent !important;
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
