import type { WeeklyActivity } from "@/analytics/types/dashboardTypes";

type WeeklyActivityChartProps = {
  weeklyData: WeeklyActivity[];
};

export function WeeklyActivityChart({ weeklyData }: WeeklyActivityChartProps) {
  return (
    <div>
      <h2>Weekly Activity</h2>
      <div>
        {weeklyData.map((day) => (
          <div key={day.day}>
            {day.day}: {day.minutes} minutes
          </div>
        ))}
      </div>
    </div>
  );
}