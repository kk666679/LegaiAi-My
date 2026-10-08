// components/matters/overview/recent-matters.tsx
"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { Matter } from "../types";
import { MatterList } from "../library/matter-list";

export interface RecentMattersProps {
  matters: Matter[];
  onOpen?: (matter: Matter) => void;
  onViewAll?: () => void;
}

export function RecentMatters({ matters, onOpen, onViewAll }: RecentMattersProps) {
  return (
    <section aria-labelledby="recent-matters-heading" className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 id="recent-matters-heading" className="text-sm font-medium">
          Recent matters
        </h2>
        {onViewAll ? (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View all
          </Button>
        ) : null}
      </div>
      <MatterList matters={matters.slice(0, 5)} onOpen={onOpen} />
    </section>
  );
}
