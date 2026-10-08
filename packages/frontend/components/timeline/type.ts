export type Area =
  | "ESG"
  | "DIGITAL_ASSETS"
  | "AI"
  | "HUMAN_RIGHTS"
  | "CYBER"
  | "ESTATE"
  | "ARBITRATION";

export type Status = "Active" | "Pending" | "Amended" | "Guidance";

export interface TimelineEvent {
  id: string;
  dateLabel: string;
  area: Area;
  title: string;
  summary: string;
  status: Status;
  citationMarkers: string[];
}