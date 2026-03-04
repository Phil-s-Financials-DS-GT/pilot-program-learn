export type ActivityEvent = {
  type: "lesson" | "quiz" | "study";
  timestamp: Date;
  duration?: number;
};

export function calculateCurrentStreak(events: ActivityEvent[]): number {
  // Placeholder logic for now
  return 0;
}

export function calculateLongestStreak(events: ActivityEvent[]): number {
  // Placeholder logic for now
  return 0;
}