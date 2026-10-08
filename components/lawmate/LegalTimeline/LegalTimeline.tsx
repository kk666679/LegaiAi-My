'use client';
import * as React from 'react';

export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  description?: string;
}

export interface LegalTimelineProps {
  events?: TimelineEvent[];
  className?: string;
}

export default function LegalTimeline({ events = [], className = '' }: LegalTimelineProps) {
  return (
    <ol className={`space-y-3 ${className}`}>
      {events.map((e) => (
        <li key={e.id} className="border-l-2 border-muted pl-3">
          <time className="text-xs text-muted-foreground">{e.date}</time>
          <div className="font-medium">{e.title}</div>
          {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
        </li>
      ))}
    </ol>
  );
}
