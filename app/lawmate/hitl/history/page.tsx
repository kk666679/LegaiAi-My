import { QueueClient } from "../_components/queue-client";

export default function Page() {
  return (
    <QueueClient
      title="Review history"
      description="Browse completed and past review requests."
      scope="history"
    />
  );
}