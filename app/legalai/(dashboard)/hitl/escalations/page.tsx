import { QueueClient } from "../_components/queue-client";

export default function Page() {
  return (
    <QueueClient
      title="Escalation filtering unavailable"
      description="This view shows pending actions requiring human approval; escalation filtering is not available."
      scope="escalations"
    />
  );
}