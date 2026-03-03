import type {
  ModuleAccuracy,
  ModuleProgress,
  WeeklyActivity,
  TimeSpentSummary
} from "../types/dashboardTypes";
export const mockModuleAccuracy: ModuleAccuracy[] = [
  { moduleId: "budgeting", accuracyPercent: 82 },
  { moduleId: "investing", accuracyPercent: 65 },
  { moduleId: "saving", accuracyPercent: 91 },
];

export const mockModuleProgress: ModuleProgress[] = [
  { moduleId: "budgeting", status: "completed" },
  { moduleId: "investing", status: "in-progress" },
  { moduleId: "saving", status: "completed" },
];

export const mockWeeklyActivity: WeeklyActivity[] = [
  { day: "Mon", minutes: 20 },
  { day: "Tue", minutes: 15 },
  { day: "Wed", minutes: 0 },
  { day: "Thu", minutes: 35 },
  { day: "Fri", minutes: 25 },
  { day: "Sat", minutes: 10 },
  { day: "Sun", minutes: 0 },
];

export const mockTimeSpentSummary: TimeSpentSummary = {
  daily: 30,
  weekly: 120,
  perModule: {
    budgeting: 60,
    investing: 30,
    saving: 30,
  },
};
export const mockStreak = {
  current: 4,
  longest: 7,
};