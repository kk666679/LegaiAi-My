"use client";
import { useMemo, useState } from "react";
import { EVENTS } from "./data";
import { AREAS } from "./constants";
import { Area } from "./types";
import { TimelineFilters } from "./TimeLineFilters";
import { TimelineList } from "./TimeLineList";
import { TimelineStats } from "./TimeLineStats";

export default function LegalTimeline() {
  const [area, setArea] = useState<Area>((AREAS[0] ?? '') as Area);
  const [activeOnly, setActiveOnly] = useState(false);

  const filteredEvents = useMemo(() => {
    return EVENTS.filter(
      (ev) => ev.area === area && (!activeOnly || ev.status === "Active")
    ).sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
  }, [area, activeOnly]);

  const active = filteredEvents.filter((e) => e.status === "Active").length;
  const pending = filteredEvents.filter((e) => e.status === "Pending").length;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <TimelineFilters
        area={area}
        activeOnly={activeOnly}
        onAreaChange={setArea}
        onActiveOnlyChange={setActiveOnly}
      />
      <TimelineStats total={filteredEvents.length} active={active} pending={pending} />
      <TimelineList events={filteredEvents} />
    </div>
  );
}
