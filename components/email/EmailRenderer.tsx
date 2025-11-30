import React from "react";
import {
  detectContentType,
  EmailContentType,
} from "@/lib/email/content-detector";
import { HtmlEmailContent } from "./HtmlEmailContent";
import { PlainTextEmailContent } from "./PlainTextEmailContent";
import { MarkdownEmailContent } from "./MarkdownEmailContent";

interface EmailRendererProps {
  bodyHtml?: string | null;
  bodyText?: string | null;
  className?: string;
}

export const EmailRenderer: React.FC<EmailRendererProps> = ({
  bodyHtml,
  bodyText,
  className = "",
}) => {
  const contentType: EmailContentType = detectContentType(bodyHtml, bodyText);

  console.log("[EmailRenderer] Content Type:", contentType);
  console.log("[EmailRenderer] HTML length:", bodyHtml?.length);
  console.log("[EmailRenderer] Text length:", bodyText?.length);

  switch (contentType) {
    case "html":
      // If bodyHtml is present, use it. If not, and we detected html, it must be in bodyText.
      const htmlContent =
        bodyHtml && bodyHtml.trim().length > 0 ? bodyHtml : bodyText || "";
      return <HtmlEmailContent content={htmlContent} className={className} />;
    case "markdown":
      return <MarkdownEmailContent content={bodyText!} className={className} />;
    case "text":
      return (
        <PlainTextEmailContent content={bodyText!} className={className} />
      );
    default:
      return (
        <div className={`p-8 text-center text-muted-foreground ${className}`}>
          This email has no readable content.
        </div>
      );
  }
};
