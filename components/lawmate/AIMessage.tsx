"use client";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageResponse } from "@/components/ai-elements/message";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export interface AIMessageProps {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  avatar?: string;
  timestamp?: Date | string;
  citations?: Array<{ id: string; label: string; url?: string }>;
  confidence?: number;
  streaming?: boolean;
  metadata?: Record<string, unknown>;
  onCopy?: () => void;
  className?: string;
}

export function AIMessage({
  role,
  content,
  name,
  avatar,
  timestamp,
  citations,
  confidence,
  streaming = false,
  metadata,
  onCopy,
  className,
}: AIMessageProps) {
  const [copied, setCopied] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streaming && messageRef.current) {
      messageRef.current.scrollTop = messageRef.current.scrollHeight;
    }
  }, [content, streaming]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.();
    } catch {
      // noop
    }
  };

  const formatTime = (date: Date | string | undefined) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isUser = role === "user";
  const isAssistant = role === "assistant";

  return (
    <div
      ref={messageRef}
      className={cn(
        "flex gap-3 max-w-[90%]",
        isUser ? "flex-row-reverse ml-auto" : "mr-auto",
        className
      )}
    >
      {!isUser && (
        <Avatar className="size-8 shrink-0">
          {avatar ? <AvatarImage src={avatar} alt="" /> : null}
          <AvatarFallback className="text-xs font-medium">
            {name?.[0]?.toUpperCase() ?? "AI"}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "flex flex-col gap-1.5 max-w-full",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-xs"
              : "bg-muted rounded-tl-xs"
          )}
        >
          {name && !isUser && (
            <p className="text-xs font-medium text-muted-foreground mb-1">
              {name}
            </p>
          )}
          <MessageResponse className={cn(isUser ? "text-sm" : "text-sm")}>
            {content}
          </MessageResponse>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 text-[10px] text-muted-foreground",
            isUser ? "justify-end" : "justify-start"
          )}
        >
          {timestamp && <span>{formatTime(timestamp)}</span>}
          {confidence !== undefined && (
            <Badge variant="outline" className="h-4 px-1.5">
              {Math.round(confidence * 100)}%
            </Badge>
          )}
          {citations && citations.length > 0 && (
            <span className="flex items-center gap-0.5">
              <ChevronDown className="size-3" />
              {citations.length} source{citations.length > 1 ? "s" : ""}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 gap-1"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy message"}
          >
            {copied ? <Check className="size-3 text-green-500" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {isUser && (
        <Avatar className="size-8 shrink-0">
          {avatar ? <AvatarImage src={avatar} alt="" /> : null}
          <AvatarFallback className="text-xs font-medium">
            {name?.[0]?.toUpperCase() ?? "U"}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}