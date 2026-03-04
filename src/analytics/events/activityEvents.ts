export type ActivityEvent = {
  id: string;
  type: "lesson" | "quiz" | "study";
  timestamp: Date;
  duration?: number;
};