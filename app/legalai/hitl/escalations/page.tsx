import { QueueClient } from "../_components/queue-client";

export default function Page() {
  return (
    <QueueClient
      title="Escalations"
      description="Review actions requiring elevated attention."
      scope="escalations"
    />
  );
}