// components/matters/library/matter-list.tsx
"use client";

import * as React from "react";
import type { Matter } from "../types";
import { MatterRow } from "./matter-row";

export interface MatterListProps {
  matters: Matter[];
  onOpen?: (matter: Matter) => void;
  onMenu?: (matter: Matter, anchor: HTMLElement) => void;
}

export function MatterList({ matters, onOpen, onMenu }: MatterListProps) {
  return (
    <div className="space-y-2">
      {matters.map((m) => (
        <MatterRow key={m.id} matter={m} onOpen={onOpen} onMenu={onMenu} />
      ))}
    </div>
  );
}
