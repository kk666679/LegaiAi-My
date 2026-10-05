// components/matters/notes/matter-notes.tsx
"use client";

import * as React from "react";
import { Pin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { MatterNote } from "../types";

export interface MatterNotesProps {
  notes: MatterNote[];
  onAdd?: (body: string) => void;
}

export function MatterNotes({ notes, onAdd }: MatterNotesProps) {
  const [draft, setDraft] = React.useState("");

  return (
    <div className="space-y-4">
      <Card className="space-y-2 p-3">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a note…"
          rows={3}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!draft.trim()}
            onClick={() => {
              onAdd?.(draft.trim());
              setDraft("");
            }}
          >
            <Plus className="size-3.5" /> Add note
          </Button>
        </div>
      </Card>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <Card key={n.id} className="space-y-1.5 p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{n.authorName}</span>
                <span className="flex items-center gap-2">
                  {n.pinned ? <Pin className="size-3 text-amber-500" aria-label="Pinned" /> : null}
                  {new Date(n.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm">{n.body}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
