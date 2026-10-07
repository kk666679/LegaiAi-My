import { QueueClient } from "../_components/queue-client";

export default function Page() {
  return (
    <QueueClient
      title="HITL analytics"
      description="Current review queue metrics and activity."
      scope="all"
    />
  );
}