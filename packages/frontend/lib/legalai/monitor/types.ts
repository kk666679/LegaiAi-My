export type MonitorAction = "subscribe" | "detect_trend" | "send_alert";

export interface SubscriptionRequest {
  action: "subscribe";
  userId: string;
  topics: string[];
}

export interface SubscriptionResponse {
  userId: string;
  subscribed: string[];
  timestamp: string;
}

export interface TrendRequest {
  action: "detect_trend";
  series: number[];
}

export interface TrendResponse {
  trend: "rising" | "falling" | "stable" | "insufficient_data";
  score: number;
  mean: number;
  lastValue: number;
  deviation: number;
  message: string;
}

export interface AlertRequest {
  action: "send_alert";
  alert: {
    title: string;
    body?: string;
    sourceUrl?: string;
    confidence: number;
    topic: string;
  };
}

export interface AlertResponse {
  sent: boolean;
  summary?: string;
  sentAt?: string;
  reason?: "confidence_too_low" | "duplicate";
}

export interface AlertHistoryItem {
  id: string;
  title: string;
  topic: string;
  confidence: number;
  sentAt: string;
  sent: boolean;
  summary?: string;
  reason?: string;
}

