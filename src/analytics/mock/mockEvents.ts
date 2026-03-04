export type ActivityEvent = {
  id: string;
  userId: string;
  type: "lesson" | "quiz" | "study";
  timestamp: Date;
  duration: number; // in minutes
  xp: number;
};
export const mockEvents: ActivityEvent[] = [
  // Week 1 - Strong streak start
  { id: "1", userId: "u1", type: "lesson", timestamp: new Date("2026-02-20T09:00:00"), duration: 25, xp: 50 },
  { id: "2", userId: "u1", type: "quiz", timestamp: new Date("2026-02-21T14:00:00"), duration: 15, xp: 30 },
  { id: "3", userId: "u1", type: "study", timestamp: new Date("2026-02-22T10:00:00"), duration: 45, xp: 40 },
  { id: "4", userId: "u1", type: "lesson", timestamp: new Date("2026-02-23T08:00:00"), duration: 30, xp: 60 },
  { id: "5", userId: "u1", type: "quiz", timestamp: new Date("2026-02-24T16:00:00"), duration: 20, xp: 35 },

  // Same-day multiple events (important edge case)
  { id: "6", userId: "u1", type: "lesson", timestamp: new Date("2026-02-25T09:00:00"), duration: 20, xp: 50 },
  { id: "7", userId: "u1", type: "study", timestamp: new Date("2026-02-25T19:00:00"), duration: 35, xp: 40 },

  { id: "8", userId: "u1", type: "quiz", timestamp: new Date("2026-02-26T13:00:00"), duration: 15, xp: 30 },

  // Streak break here (Feb 27 skipped)

  // Week 2 - Restart streak
  { id: "9", userId: "u1", type: "lesson", timestamp: new Date("2026-02-28T09:30:00"), duration: 40, xp: 70 },
  { id: "10", userId: "u1", type: "quiz", timestamp: new Date("2026-03-01T15:00:00"), duration: 25, xp: 45 },
  { id: "11", userId: "u1", type: "study", timestamp: new Date("2026-03-02T11:00:00"), duration: 60, xp: 60 },
  { id: "12", userId: "u1", type: "lesson", timestamp: new Date("2026-03-03T08:45:00"), duration: 35, xp: 55 },

  // Weekend high engagement spike
  { id: "13", userId: "u1", type: "study", timestamp: new Date("2026-03-05T10:00:00"), duration: 90, xp: 100 },
  { id: "14", userId: "u1", type: "quiz", timestamp: new Date("2026-03-05T14:00:00"), duration: 30, xp: 50 },
];