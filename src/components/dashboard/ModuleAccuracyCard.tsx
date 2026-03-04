import type { ModuleAccuracy } from "@/analytics/types/dashboardTypes";

type ModuleAccuracyCardProps = {
  accuracyData: ModuleAccuracy[];
  underperformingThreshold: number;
};

export function ModuleAccuracyCard({
  accuracyData,
  underperformingThreshold,
}: ModuleAccuracyCardProps) {
  return (
    <div>
      <h2>Module Accuracy</h2>
      {accuracyData.map((module) => (
        <div key={module.moduleId}>
          {module.moduleId}: {module.accuracyPercent}%
          {module.accuracyPercent < underperformingThreshold && (
            <span> ⚠️</span>
          )}
        </div>
      ))}
    </div>
  );
}
