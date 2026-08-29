"use client";

import React from "react";
import { motion } from "framer-motion";

interface TimelineItem {
  date: string;
  status: string;
  progress: number;
}

interface AITimelineProps {
  items: TimelineItem[];
  activeIndex?: number;
  showProgress?: boolean;
  enhanced?: boolean;
  className?: string;
}

export const AITimeline: React.FC<AITimelineProps> = ({
  items,
  activeIndex = 0,
  showProgress = false,
  enhanced = false,
  className = "",
}) => {
  return (
    <div className={`relative ${className}`}>
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
      
      <div className="space-y-6">
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const isCompleted = index < activeIndex;
          const isUpcoming = index > activeIndex;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-4"
            >
              {/* Timeline Dot */}
              <div className="relative z-10 flex-shrink-0">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center
                    ${isActive 
                      ? "bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30" 
                      : isCompleted
                      ? "bg-gradient-to-br from-green-500 to-emerald-500"
                      : "bg-gray-100 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700"
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : isActive ? (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-3 h-3 bg-white rounded-full"
                    />
                  ) : (
                    <span className="text-xs font-medium text-gray-400">{index + 1}</span>
                  )}
                </motion.div>
              </div>
              
              {/* Content */}
              <div className="flex-1 pt-1">
                <div className={`
                  p-4 rounded-xl
                  ${isActive 
                    ? "bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800" 
                    : isCompleted
                    ? "bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700"
                    : "bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700"
                  }
                `}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`
                      text-xs font-medium px-2 py-1 rounded-full
                      ${isActive 
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300" 
                        : isCompleted
                        ? "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }
                    `}>
                      {item.status}
                    </span>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {item.date}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  {showProgress && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-500 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {isCompleted ? 100 : isActive ? item.progress : 0}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${isCompleted ? 100 : isActive ? item.progress : 0}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`
                            h-full rounded-full
                            ${isActive 
                              ? "bg-gradient-to-r from-purple-500 to-blue-500" 
                              : isCompleted
                              ? "bg-gradient-to-r from-green-500 to-emerald-500"
                              : "bg-gray-300 dark:bg-gray-600"
                            }
                          `}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

