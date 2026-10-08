// components/matters/library/matter-grid.tsx
"use client";

import * as React from "react";
import type { Matter } from "../types";
import { MatterCard } from "./matter-card";

export interface MatterGridProps {
  matters: Matter[];
  onOpen?: (matter: Matter) => void;
  onFavoriteChange?: (matter: Matter, next: boolean) => void;
  onMenu?: (matter: Matter, anchor: HTMLElement) => void;
}

export function MatterGrid({ matters, onOpen, onFavoriteChange, onMenu }: MatterGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {matters.map((m) => (
        <MatterCard
          key={m.id}
          matter={m}
          onOpen={onOpen}
          onFavoriteChange={onFavoriteChange}
          onMenu={onMenu}
        />
      ))}
    </div>
  );
}
