"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Send, Mic, Paperclip, ArrowUp } from "lucide-react";
import { useState, useRef, useImperativeHandle, forwardRef } from "react";

export interface AIComposerRef {
  focus: () => void;
  clear: () => void;
  getValue: () => string;
}

export interface AIComposerProps {
  onSend?: (message: string, attachments?: File[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
  showAttachment?: boolean;
  showVoice?: boolean;
}

export const AIComposer = forwardRef<AIComposerRef, AIComposerProps>(
  (
    {
      onSend,
      placeholder = "Ask a legal question...",
      disabled = false,
      className,
      maxLength = 4000,
      showAttachment = true,
      showVoice = false,
    },
    ref
  ) => {
    const [message, setMessage] = useState("");
    const [hasAttachment, setHasAttachment] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      clear: () => setMessage(""),
      getValue: () => message,
    }));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!message.trim() || disabled) return;
      onSend?.(message.trim());
      setMessage("");
      setHasAttachment(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    };

    return (
      <form onSubmit={handleSubmit} className={cn("flex flex-col gap-2", className)}>
        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, maxLength))}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              maxLength={maxLength}
              className="pr-12 min-h-[44px] resize-none"
              aria-label="Compose message"
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              {showVoice && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  disabled={disabled}
                  aria-label="Voice input"
                >
                  <Mic className="size-4" />
                </Button>
              )}
              {showAttachment && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8"
                  disabled={disabled}
                  aria-label="Attach file"
                >
                  <Paperclip className="size-4" />
                </Button>
              )}
            </div>
          </div>
          <Button
            type="submit"
            disabled={disabled || !message.trim()}
            className="h-10 w-10 rounded-full shrink-0"
            aria-label="Send message"
          >
            <ArrowUp className="size-4" />
          </Button>
        </div>
        {message.length > maxLength * 0.9 && (
          <p className="text-right text-xs text-muted-foreground">
            {message.length}/{maxLength}
          </p>
        )}
      </form>
    );
  }
);

AIComposer.displayName = "AIComposer";