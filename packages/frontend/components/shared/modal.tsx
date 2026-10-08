 "use client";
import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { GlassCard } from "./glass-card";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const Modal = ({ isOpen, onClose, title, children, className }: ModalProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <GlassCard
        className={cn("max-w-2xl w-full max-h-[80vh] overflow-auto p-6 md:p-8", className)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold font-space text-white">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        {children}
      </GlassCard>
    </div>
  );
};

