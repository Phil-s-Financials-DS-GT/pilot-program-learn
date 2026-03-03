import {
  mockModuleAccuracy,
  mockModuleProgress,
  mockWeeklyActivity,
  mockTimeSpentSummary,
  mockStreak,
} from "@/analytics/mock/dashboardMockData";

import { dashboardConfig } from "@/analytics/config/dashboardConfig";

import { ModuleAccuracyCard } from "./ModuleAccuracyCard";
import { ModuleCompletionCard } from "./ModuleCompletionCard";
import { TimeSpentCard } from "./TimeSpentCard";
import { WeeklyActivityChart } from "./WeeklyActivityChart";
import { StreakCounter } from "./StreakCounter";

export function Dashboard() {
  return (
    <div>
      <ModuleAccuracyCard
        accuracyData={mockModuleAccuracy}
        underperformingThreshold={dashboardConfig.underperformingThreshold}
      />

      <ModuleCompletionCard
        progressData={mockModuleProgress}
        totalModules={5}
      />

      <TimeSpentCard timeSummary={mockTimeSpentSummary} />

      <WeeklyActivityChart weeklyData={mockWeeklyActivity} />

      <StreakCounter
        current={mockStreak.current}
        longest={mockStreak.longest}
      />
    </div>
  );
}