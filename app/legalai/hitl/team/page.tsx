import { QueueClient } from "../_components/queue-client";

export default function Page() {
  return (
    <QueueClient
      title="Team filtering unavailable"
      description="All pending agent actions are shown because team assignment data is not available."
      scope="team"
    />
  );
}
