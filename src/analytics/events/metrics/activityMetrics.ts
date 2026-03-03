import { ActivityEvent } from "../activityEvents";

/**
 * Filters events within the last 7 days
 */
function getWeeklyEvents(events: ActivityEvent[]): ActivityEvent[] {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);

  return events.filter(event => event.timestamp >= sevenDaysAgo);
}

/**
 * Total minutes studied in the last 7 days
 */
export function calculateWeeklyMinutes(events: ActivityEvent[]): number {
  const weeklyEvents = getWeeklyEvents(events);

  return weeklyEvents.reduce((total, event) => {
    return total + (event.duration ?? 0);
  }, 0);
}

/**
 * Total lessons completed in the last 7 days
 */
export function calculateWeeklyLessons(events: ActivityEvent[]): number {
  const weeklyEvents = getWeeklyEvents(events);

  return weeklyEvents.filter(event => event.type === "lesson").length;
}

/**
 * Total quizzes completed in the last 7 days
 */
export function calculateWeeklyQuizzes(events: ActivityEvent[]): number {
  const weeklyEvents = getWeeklyEvents(events);

  return weeklyEvents.filter(event => event.type === "quiz").length;
}