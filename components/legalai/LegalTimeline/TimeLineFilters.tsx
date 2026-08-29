"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import {
  AREA_LABELS,
  AREA_OPTIONS,
} from "./constants";

import { Area } from "./types";

type Props = {
  area: Area;
  activeOnly: boolean;
  onAreaChange: (value: Area) => void;
  onActiveOnlyChange: (
    value: boolean
  ) => void;
};

export function TimelineFilters({
  area,
  activeOnly,
  onAreaChange,
  onActiveOnlyChange,
}: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          Filters
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-wrap gap-2">
          {AREA_OPTIONS.map((item) => (
            <Button
              key={item}
              size="sm"
              variant={
                area === item
                  ? "default"
                  : "outline"
              }
              onClick={() =>
                onAreaChange(item)
              }
            >
              {AREA_LABELS[item]}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Checkbox
            id="active-only"
            checked={activeOnly}
            onCheckedChange={(checked) =>
              onActiveOnlyChange(
                Boolean(checked)
              )
            }
          />

          <label
            htmlFor="active-only"
            className="text-sm font-medium"
          >
            Show only active developments
          </label>
        </div>
      </CardContent>
    </Card>
  );
}