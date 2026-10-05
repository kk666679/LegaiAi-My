// components/matters/charts/primitives/donut-chart.tsx
"use client";

import * as React from "react";
import { ChartContainer } from "./chart-container";
import { ChartTooltip, type ChartTooltipState } from "./chart-tooltip";
import { colorAt, donutArc, polarPoint, resolveColor, sum } from "./chart-utils";

export interface DonutDatum {
  label: string;
  value: number;
  color?: string;
}

export interface DonutChartProps {
  data: DonutDatum[];
  height?: number;
  thickness?: number;
  centerLabel?: string;
  valueFormatter?: (n: number) => string;
  ariaLabel?: string;
  onSelect?: (d: DonutDatum) => void;
}

export function DonutChart({
  data,
  height = 240,
  thickness = 32,
  centerLabel,
  valueFormatter = (n) => String(n),
  ariaLabel,
  onSelect,
}: DonutChartProps) {
  const [tooltip, setTooltip] = React.useState<ChartTooltipState | null>(null);
  const [width, setWidth] = React.useState(0);
  const [hoverIdx, setHoverIdx] = React.useState<number | null>(null);

  const total = sum(data.map((d) => d.value));
  const visible = data.filter((d) => d.value > 0);

  if (visible.length === 0 || total === 0) return null;

  return (
    <ChartContainer height={height} ariaLabel={ariaLabel}>
      {({ width: w, height: h }) => {
        setWidth(w);
        const cx = w / 2;
        const cy = h / 2;
        const R = Math.min(w, h) / 2 - 8;
        const r = Math.max(0, R - thickness);
        const START = -Math.PI / 2;

        let angle = START;
        const arcs = visible.map((d, i) => {
          const slice = (d.value / total) * Math.PI * 2;
          const a0 = angle;
          const a1 = angle + slice;
          angle = a1;
          const mid = (a0 + a1) / 2;
          const labelPoint = polarPoint(cx, cy, (R + r) / 2, mid);
          return {
            datum: d,
            path: donutArc(cx, cy, R, r, a0, a1),
            mid,
            labelPoint,
            color: resolveColor(d.color ?? colorAt(i), i),
            pct: (d.value / total) * 100,
          };
        });

        return (
          <div className="relative size-full">
            <svg width={w} height={h} role="presentation">
              {arcs.map((a, i) => (
                <path
                  key={i}
                  d={a.path}
                  fill={a.color}
                  className="cursor-pointer transition-opacity"
                  style={{ opacity: hoverIdx === null || hoverIdx === i ? 1 : 0.5 }}
                  onMouseEnter={() => {
                    setHoverIdx(i);
                    setTooltip({
                      x: a.labelPoint.x,
                      y: a.labelPoint.y,
                      title: a.datum.label,
                      rows: [
                        { label: "Count", value: valueFormatter(a.datum.value), color: a.color },
                        { label: "Share", value: `${a.pct.toFixed(1)}%`, color: a.color },
                      ],
                    });
                  }}
                  onMouseLeave={() => {
                    setHoverIdx(null);
                    setTooltip(null);
                  }}
                  onClick={() => onSelect?.(a.datum)}
                />
              ))}
              {/* Center label */}
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                className="fill-foreground text-lg font-semibold tabular-nums"
              >
                {valueFormatter(total)}
              </text>
              {centerLabel ? (
                <text
                  x={cx}
                  y={cy + 12}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[11px]"
                >
                  {centerLabel}
                </text>
              ) : null}
            </svg>
            <ChartTooltip state={tooltip} containerWidth={width} />
          </div>
        );
      }}
    </ChartContainer>
  );
}
