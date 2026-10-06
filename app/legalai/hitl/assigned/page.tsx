import { QueueClient } from "../_components/queue-client";

export default function Page() {
  return (
    <QueueClient
      title="Assigned to me"
      description="Requests assigned to you for review."
      scope="assigned"
    />
  );
}