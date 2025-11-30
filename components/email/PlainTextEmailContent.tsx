import React from "react";
import { parsePlainText } from "@/lib/email/plaintext-parser";

interface PlainTextEmailContentProps {
  content: string;
  className?: string;
}

export const PlainTextEmailContent: React.FC<PlainTextEmailContentProps> = ({
  content,
  className,
}) => {
  const htmlContent = parsePlainText(content);

  return (
    <div
      className={`whitespace-pre-wrap text-sm ${className}`}
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
      }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
