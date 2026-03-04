export type ModuleAccuracy = {
  moduleId: string;
  accuracyPercent: number;
};

export type ModuleProgress = {
  moduleId: string;
  status: "completed" | "in-progress";
};

export type WeeklyActivity = {
  day: string;
  minutes: number;
};

export type TimeSpentSummary = {
  daily: number;
  weekly: number;
  perModule: Record<string, number>;
};