// components/matters/charts/primitives/line-chart.tsx
"use client";

import * as React from "react";
import { ChartContainer } from "./chart-container";
import { ChartTooltip, type ChartTooltipState } from "./chart-tooltip";
import {
  areaPath,
  colorAt,
  formatCompact,
  linePath,
  maxOf,
  niceTicks,
  resolveColor,
  truncateLabel,
  type Pt,
} from "./chart-utils";

export interface LineSeries {
  name: string;
  color?: string;
}

export interface LineDatum {
  label: string;
  values: number[];
}

export interface LineChartProps {
  data: LineDatum[];
  series: LineSeries[];
  area?: boolean;
  height?: number;
  valueFormatter?: (n: number) => string;
  ariaLabel?: string;
  onSelect?: (d: LineDatum) => void;
}

const PAD = { top: 12, right: 12, bottom: 34, left: 40 };

export function LineChart({
  data,
  series,
  area = false,
  height = 240,
  valueFormatter = formatCompact,
  ariaLabel,
  onSelect,
}: LineChartProps) {
  const [tooltip, setTooltip] = React.useState<ChartTooltipState | null>(null);
  const [width, setWidth] = React.useState(0);
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);

  if (data.length === 0 || series.length === 0) return null;

  const plotMax = maxOf(data);
  const ticks = niceTicks(plotMax, 4);
  const top = ticks[ticks.length - 1] || 1;

  return (
    <ChartContainer height={height} ariaLabel={ariaLabel}>
      {({ width: w, height: h }) => {
        setWidth(w);
        const plotW = w - PAD.left - PAD.right;
        const plotH = h - PAD.top - PAD.bottom;

        const xAt = (i: number) =>
          data.length === 1 ? PAD.left + plotW / 2 : PAD.left + (i / (data.length - 1)) * plotW;
        const yAt = (v: number) => PAD.top + plotH * (1 - v / top);

        const seriesPaths = series.map((s, si) => {
          const pts: Pt[] = data.map((d, i) => ({ x: xAt(i), y: yAt(d.values[si] ?? 0) }));
          return {
            series: s,
            color: resolveColor(s.color ?? colorAt(si), si),
            d: linePath(pts, true),
            areaD: area ? areaPath(pts, PAD.top + plotH, true) : "",
            points: pts,
          };
        });

        return (
          <div className="relative size-full">
            <svg
              width={w}
              height={h}
              role="presentation"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const t = (x - PAD.left) / plotW;
                if (t < -0.02 || t > 1.02) {
                  setHoverIndex(null);
                  setTooltip(null);
                  return;
                }
                const i = Math.round(t * (data.length - 1));
                const point = data[i];
                if (!point) return;
                setHoverIndex(i);
                setTooltip({
                  x: xAt(i),
                  y: PAD.top,
                  title: point.label,
                  rows: series.map((s, si) => ({
                    label: s.name,
                    value: valueFormatter(point.values[si] ?? 0),
                    color: resolveColor(s.color ?? colorAt(si), si),
                  })),
                });
              }}
              onMouseLeave={() => {
                setHoverIndex(null);
                setTooltip(null);
              }}
            >
              {ticks.map((t, i) => (
                <g key={i}>
                  <line
                    x1={PAD.left}
                    x2={w - PAD.right}
                    y1={yAt(t)}
                    y2={yAt(t)}
                    stroke="currentColor"
                    strokeOpacity={i === 0 ? 0.25 : 0.1}
                  />
                  <text
                    x={PAD.left - 6}
                    y={yAt(t)}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {valueFormatter(t)}
                  </text>
                </g>
              ))}

              {seriesPaths.map((sp, i) => (
                <g key={i}>
                  {area && sp.areaD ? (
                    <path d={sp.areaD} fill={sp.color} fillOpacity={0.12} />
                  ) : null}
                  <path
                    d={sp.d}
                    fill="none"
                    stroke={sp.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </g>
              ))}

              {/* Hover indicator */}
              {hoverIndex !== null ? (
                <g>
                  <line
                    x1={xAt(hoverIndex)}
                    x2={xAt(hoverIndex)}
                    y1={PAD.top}
                    y2={PAD.top + plotH}
                    stroke="currentColor"
                    strokeOpacity={0.2}
                    strokeDasharray="3 3"
                  />
                  {series.map((item, si) => (
                    <circle
                      key={si}
                      cx={xAt(hoverIndex)}
                      cy={yAt(data[hoverIndex]?.values[si] ?? 0)}
                      r={3.5}
                      fill={resolveColor(item.color ?? colorAt(si), si)}
                      stroke="var(--background)"
                      strokeWidth={2}
                    />
                  ))}
                </g>
              ) : null}

              {/* X labels — show subset for readability */}
              {data.map((d, i) => {
                const step = Math.max(1, Math.ceil(data.length / 8));
                if (i % step !== 0 && i !== data.length - 1) return null;
                return (
                  <text
                    key={i}
                    x={xAt(i)}
                    y={h - PAD.bottom + 14}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[10px]"
                  >
                    {truncateLabel(d.label, 10)}
                  </text>
                );
              })}
            </svg>
            <ChartTooltip state={tooltip} containerWidth={width} />
          </div>
        );
      }}
    </ChartContainer>
  );
}
