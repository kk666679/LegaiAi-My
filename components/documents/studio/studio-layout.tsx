"use client";
import * as React from "react";
import { DraftingStudio } from "./drafting-studio";
import { StudioOutline, type OutlineSection } from "./studio-outline";
import { StudioEditor } from "./studio-editor";
import { StudioToolbar, type StudioTemplate } from "./studio-toolbar";
import { StudioAIPanel, type StudioAIAction, type StudioAIMessage } from "./studio-ai-panel";

export interface StudioLayoutProps {
  title: string;
  status?: string;
  templates?: StudioTemplate[];
  templateId?: string;
  onTemplateChange?: (id: string) => void;
  sections: OutlineSection[];
  activeSectionId?: string;
  onSectionSelect?: (id: string) => void;
  onSectionAdd?: () => void;
  onSectionReorder?: (fromId: string, toId: string) => void;
  body: string;
  onBodyChange: (v: string) => void;
  messages: StudioAIMessage[];
  running?: string | null;
  aiActions?: StudioAIAction[];
  onAIAction?: (id: string, label: string) => void;
  composerSlot?: React.ReactNode;
  onSave?: () => void;
  onExport?: (format: "PDF" | "DOCX" | "TXT" | "MD") => void;
  onShare?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export function StudioLayout(props: StudioLayoutProps) {
  return (
    <DraftingStudio
      toolbar={
        <StudioToolbar title={props.title} status={props.status} templates={props.templates} templateId={props.templateId}
          onTemplateChange={props.onTemplateChange} onSave={props.onSave} onExport={props.onExport} onShare={props.onShare}
          onUndo={props.onUndo} onRedo={props.onRedo} canUndo={props.canUndo} canRedo={props.canRedo} />
      }
      outline={<StudioOutline sections={props.sections} activeId={props.activeSectionId} onSelect={props.onSectionSelect} onAdd={props.onSectionAdd} onReorder={props.onSectionReorder} />}
      editor={<StudioEditor value={props.body} onChange={props.onBodyChange} title={props.title} subtitle={props.templates?.find((t) => t.id === props.templateId)?.label} status={props.status ?? "Draft"} />}
      aiPanel={<StudioAIPanel messages={props.messages} running={props.running} actions={props.aiActions} onAction={props.onAIAction} composerSlot={props.composerSlot} />}
    />
  );
}
