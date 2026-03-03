import type { TimeSpentSummary } from "@/analytics/types/dashboardTypes";

type TimeSpentCardProps = {
  timeSummary: TimeSpentSummary;
};

export function TimeSpentCard({ timeSummary }: TimeSpentCardProps) {
  return (
    <div>
      <h2>Time Spent</h2>

      <p>Daily: {timeSummary.daily} minutes</p>
      <p>Weekly: {timeSummary.weekly} minutes</p>

      <h3>Per Module</h3>
      <ul>
        {Object.entries(timeSummary.perModule).map(([module, minutes]) => (
          <li key={module}>
            {module}: {minutes} minutes
          </li>
        ))}
      </ul>
    </div>
  );
}