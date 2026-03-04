import type { ModuleProgress } from "@/analytics/types/dashboardTypes";

type ModuleCompletionCardProps = {
  progressData: ModuleProgress[];
  totalModules: number;
};

export function ModuleCompletionCard({
  progressData,
  totalModules,
}: ModuleCompletionCardProps) {
  const completedCount = progressData.filter(
    (m) => m.status === "completed"
  ).length;

  return (
    <div>
      <h2>Modules Completed</h2>
      <p>
        {completedCount} / {totalModules}
      </p>
    </div>
  );
}