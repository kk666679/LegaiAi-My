"use client";

import { useEffect, useState } from "react";

interface ConfidenceGaugeProps {
  confidence: number;
  size?: number;
}

export function ConfidenceGauge({ confidence, size = 120 }: ConfidenceGaugeProps) {
  const [rotation, setRotation] = useState(-90);
  
  useEffect(() => {
    const angle = -90 + (confidence * 180);
    setRotation(angle);
  }, [confidence]);

  const getColor = (value: number) => {
    if (value >= 0.9) return "#22c55e";
    if (value >= 0.7) return "#eab308";
    if (value >= 0.5) return "#f97316";
    return "#ef4444";
  };

  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference * (1 - confidence);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: `${size}px`, height: `${size / 2 + 20}px` }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={0}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            className="dark:stroke-gray-700"
          />
          
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor(confidence)}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 0.3s ease" }}
          />
          
          <line
            x1={size / 2}
            y1={size / 2}
            x2={size / 2}
            y2={size / 2 - radius + 4}
            stroke="#374151"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${rotation} ${size / 2} ${size / 2})`}
            style={{ transition: "transform 0.3s ease" }}
            className="dark:stroke-gray-300"
          />
          
          <circle
            cx={size / 2}
            cy={size / 2}
            r="4"
            fill="#374151"
            className="dark:fill-gray-300"
          />
        </svg>
        
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground px-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>
      
      <div className="flex justify-between w-full mt-2 text-xs">
        <div className="flex flex-col items-center">
          <div className="w-px h-2 bg-red-500" />
          <span className="text-red-500">0.9</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-px h-2 bg-gray-400" />
          <span className="text-muted-foreground">Threshold</span>
        </div>
      </div>
    </div>
  );
}

