"use client";
import * as React from "react";

export interface UseEventStreamOptions {
  /** Connect to the stream immediately on mount. Default true. */
  enabled?: boolean;
  /** Filter received events to only those whose `type` field starts with one of these prefixes. */
  filterTypes?: string[];
  /** Base URL override (defaults to `/api/events/stream`). */
  url?: string;
  /** Max reconnect delay in ms. Default 30 000. */
  maxReconnectDelay?: number;
}

export interface UseEventStreamResult {
  connected: boolean;
  lastEvent: unknown;
  events: unknown[];
  reconnectCount: number;
}

/**
 * Subscribes to the backend SSE event stream (`/api/events/stream`) with
 * automatic reconnect (exponential back‑off) and optional type filtering.
 */
export function useEventStream(options: UseEventStreamOptions = {}): UseEventStreamResult {
  const {
    enabled = true,
    filterTypes,
    url = "/api/events/stream",
    maxReconnectDelay = 30_000,
  } = options;

  const [connected, setConnected] = React.useState(false);
  const [lastEvent, setLastEvent] = React.useState<unknown>(null);
  const [events, setEvents] = React.useState<unknown[]>([]);
  const [reconnectCount, setReconnectCount] = React.useState(0);
  const sourceRef = React.useRef<EventSource | null>(null);
  const reconnectTimerRef = React.useRef<ReturnType<typeof setTimeout>>();

  React.useEffect(() => {
    if (!enabled) {
      sourceRef.current?.close();
      sourceRef.current = null;
      setConnected(false);
      return;
    }

    let delay = 1_000;

    function connect() {
      sourceRef.current?.close();
      const es = new EventSource(url);
      sourceRef.current = es;

      es.onopen = () => {
        setConnected(true);
        delay = 1_000;
      };

      es.addEventListener("message", (raw) => {
        try {
          const data = JSON.parse(raw.data) as Record<string, unknown>;
          if (filterTypes && filterTypes.length) {
            const type = (data.type as string | undefined) ?? "";
            if (!filterTypes.some((prefix) => type.startsWith(prefix))) return;
          }
          setLastEvent(data);
          setEvents((prev) => [...prev.slice(-50), data]);
        } catch {
          // ignore malformed data lines
        }
      });

      es.onerror = () => {
        setConnected(false);
        es.close();
        // Exponential back-off reconnect
        reconnectTimerRef.current = setTimeout(() => {
          setReconnectCount((c) => c + 1);
          delay = Math.min(delay * 2, maxReconnectDelay);
          connect();
        }, delay);
      };
    }

    connect();

    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, [enabled, url, filterTypes, maxReconnectDelay]);

  return { connected, lastEvent, events, reconnectCount };
}
