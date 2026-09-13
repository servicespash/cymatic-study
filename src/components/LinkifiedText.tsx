import React from "react";
import { sanitizeConjoinedLinks, LINK_PATTERNS } from "@/utils/link-parser";

interface LinkifiedTextProps {
  text: string;
  className?: string;
  isOwn?: boolean;
}

/**
 * LinkifiedText Component
 * Detects and transforms URLs, Emails, and Phone Numbers into interactive,
 * highlighted, and outlined UI elements within chat messages.
 */
export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text, className, isOwn }) => {
  if (!text) return null;

  // 1. Initial sanitization for LLM noise and conjoined links
  const sanitized = sanitizeConjoinedLinks(
    text
      .replace(/\/\/\*+/g, "")
      .replace(/\/\*+/g, "")
      .replace(/\*+\/\//g, "")
      .replace(/\/\/\s?\*+/g, "")
      .replace(/\/\*\*+/g, "")
      .trim(),
  );

  if (!sanitized) return null;

  // Combine all patterns into one global regex with capture groups
  // We wrap the whole thing in ONE capture group so split() returns the match as a token
  const combinedRegex = new RegExp(
    `(${LINK_PATTERNS.url.source}|${LINK_PATTERNS.email.source}|${LINK_PATTERNS.phone.source})`,
    "gi",
  );

  const tokens = sanitized.split(combinedRegex);

  return (
    <div className={`${className} break-words overflow-hidden [overflow-wrap:anywhere]`}>
      {tokens.map((token, index) => {
        if (!token) return null;

        // URL Matching
        if (token.match(LINK_PATTERNS.url)) {
          return (
            <a
              key={index}
              href={token}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-blue-500 underline hover:text-blue-600 transition-colors inline-block ${isOwn ? "text-white" : ""}`}
            >
              {token}
            </a>
          );
        }

        // Email Matching
        if (token.match(LINK_PATTERNS.email)) {
          return (
            <a
              key={index}
              href={`mailto:${token}`}
              className={`text-blue-500 underline hover:text-blue-600 transition-colors ${isOwn ? "text-white" : ""}`}
            >
              {token}
            </a>
          );
        }

        // Phone Number Matching
        if (token.match(LINK_PATTERNS.phone) && token.length >= 10) {
          const digitCount = token.replace(/[^0-9]/g, "").length;
          if (digitCount >= 9 && digitCount <= 15) {
            return (
              <a
                key={index}
                href={`tel:${token.replace(/[^0-9+]/g, "")}`}
                className={`text-blue-500 underline hover:text-blue-600 transition-colors ${isOwn ? "text-white" : ""}`}
              >
                {token}
              </a>
            );
          }
        }

        // Default text part
        return <span key={index}>{token}</span>;
      })}
    </div>
  );
};
