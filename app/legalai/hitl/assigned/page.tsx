import { QueueClient } from "../_components/queue-client";

export default function Page() {
  return (
    <QueueClient
      title="Assignment filtering unavailable"
      description="All pending agent actions are shown because assignment data is not available."
      scope="assigned"
    />
  );
}