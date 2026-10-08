"use client";

import { cn } from "@/lib/utils";
import { SendIcon, SquareIcon, LoaderIcon } from "lucide-react";
import type { ComponentProps, FormEvent, KeyboardEvent } from "react";
import { createContext, useCallback, useContext, useRef } from "react";

interface PromptInputContextValue {
  onSubmit: (payload: { text: string }) => void;
}

const PromptInputContext = createContext<PromptInputContextValue | null>(null);

const usePromptInput = () => {
  const ctx = useContext(PromptInputContext);
  if (!ctx) throw new Error("PromptInput components must be used within PromptInput");
  return ctx;
};

export type PromptInputProps = Omit<ComponentProps<"form">, "onSubmit"> & {
  onSubmit: (payload: { text: string }) => void;
};

export const PromptInput = ({ onSubmit, className, children, ...props }: PromptInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSubmit = useCallback(
    (e?: FormEvent) => {
      e?.preventDefault();
      const text = textareaRef.current?.value ?? "";
      if (text.trim()) onSubmit({ text });
    },
    [onSubmit]
  );

  return (
    <PromptInputContext.Provider value={{ onSubmit: ({ text }) => onSubmit({ text }) }}>
      <form
        className={cn("flex flex-col gap-2 p-3", className)}
        onSubmit={handleSubmit}
        {...props}
      >
        {children}
      </form>
    </PromptInputContext.Provider>
  );
};

export type PromptInputTextareaProps = ComponentProps<"textarea"> & {
  ref?: React.Ref<HTMLTextAreaElement>;
};

export const PromptInputTextarea = ({ className, onKeyDown, ...props }: PromptInputTextareaProps) => {
  const { onSubmit } = usePromptInput();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        const text = (e.target as HTMLTextAreaElement).value;
        if (text.trim()) onSubmit({ text });
      }
      onKeyDown?.(e);
    },
    [onSubmit, onKeyDown]
  );

  return (
    <textarea
      className={cn("w-full bg-transparent outline-none resize-none text-sm", className)}
      onKeyDown={handleKeyDown}
      rows={2}
      {...props}
    />
  );
};

export type PromptInputFooterProps = ComponentProps<"div">;

export const PromptInputFooter = ({ className, children, ...props }: PromptInputFooterProps) => (
  <div className={cn("flex items-center justify-between gap-2", className)} {...props}>
    {children}
  </div>
);

export type PromptInputSubmitProps = ComponentProps<"button"> & {
  status?: "submitted" | "streaming";
  onStop?: () => void;
};

export const PromptInputSubmit = ({ status, onStop, className, ...props }: PromptInputSubmitProps) => {
  const isLoading = status === "submitted" || status === "streaming";

  if (isLoading) {
    return (
      <button
        type="button"
        onClick={onStop}
        className={cn("flex items-center justify-center size-8 rounded-lg", className)}
        {...props}
      >
        {status === "submitted"
          ? <LoaderIcon className="size-4 animate-spin" />
          : <SquareIcon className="size-4" />}
      </button>
    );
  }

  return (
    <button
      type="submit"
      className={cn("flex items-center justify-center size-8 rounded-lg", className)}
      {...props}
    >
      <SendIcon className="size-4" />
    </button>
  );
};
