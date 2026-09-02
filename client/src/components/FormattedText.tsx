import React from "react";

interface FormattedTextProps {
  text: string;
  isUser?: boolean;
}

export function parseInlineMarkdown(text: string, isUser: boolean = false): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*.*?\*\*|\*.*?\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const matchedStr = match[0];
    if (matchedStr.startsWith("**") && matchedStr.endsWith("**") && matchedStr.length > 4) {
      const innerText = matchedStr.slice(2, -2);
      parts.push(
        <strong
          key={match.index}
          className={`font-bold ${isUser ? "text-white" : "text-[#18314a]"}`}
        >
          {innerText}
        </strong>
      );
    } else if (matchedStr.startsWith("*") && matchedStr.endsWith("*") && matchedStr.length > 2) {
      const innerText = matchedStr.slice(1, -1);
      parts.push(
        <em
          key={match.index}
          className={`italic ${isUser ? "text-white/90" : "text-[#23645f]"}`}
        >
          {innerText}
        </em>
      );
    } else {
      parts.push(matchedStr);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export default function FormattedText({ text, isUser = false }: FormattedTextProps) {
  if (!text) return null;

  // Split into lines first
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 whitespace-pre-wrap leading-5">
      {lines.map((line, lIdx) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          return <div key={lIdx} className="h-1.5" />;
        }

        // Handle case where multiple bullets are on a single line separated by " • " or "• "
        const bulletPieces = line.split(/(?=\s*•\s+)/).map((p) => p.trim()).filter(Boolean);

        return (
          <div key={lIdx} className="space-y-1">
            {bulletPieces.map((piece, pIdx) => {
              const isBullet = piece.startsWith("•") || piece.startsWith("* ") || piece.startsWith("- ");
              const cleanContent = isBullet ? piece.replace(/^[•*-]\s*/, "") : piece;
              const parsedNodes = parseInlineMarkdown(cleanContent, isUser);

              if (isBullet) {
                return (
                  <div key={pIdx} className="flex items-start gap-2 my-1 pl-1">
                    <span
                      className={`select-none font-bold shrink-0 mt-[1px] ${
                        isUser ? "text-teal-300" : "text-[#2f9c95]"
                      }`}
                    >
                      •
                    </span>
                    <span className="flex-1">{parsedNodes}</span>
                  </div>
                );
              }

              return <div key={pIdx}>{parsedNodes}</div>;
            })}
          </div>
        );
      })}
    </div>
  );
}
