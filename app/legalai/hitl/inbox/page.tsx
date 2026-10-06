import { QueueClient } from "../_components/queue-client";

export default function Page() {
  return (
    <QueueClient
      title="Inbox"
      description="Review agent actions waiting for human attention."
      scope="inbox"
    />
  );
}