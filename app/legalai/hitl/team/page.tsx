import { QueueClient } from "../_components/queue-client";

export default function Page() {
  return (
    <QueueClient
      title="Team queue"
      description="Requests awaiting review by your team."
      scope="team"
    />
  );
}
