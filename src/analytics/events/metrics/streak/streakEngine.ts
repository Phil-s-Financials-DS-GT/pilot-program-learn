import type {WeeklyActivity} from "../types/dashboardTypes";
import {mockWeeklyActivity} from "../../../mock/dashboardMockData.ts";

/*
export type ActivityEvent = {
    type: "lesson" | "quiz" | "study";
    timestamp: Date;
    duration: number;
};
*/

export type StreakConfig = {
    minimumActivityMinutes: number;
    countWeekends: boolean;
};
export type StreakResult = {
    current: number;
    longest: number;
};

const WEEKEND : WeeklyActivity["day"][] = ["Sat", "Sun"];
function weekendFilter(activity: WeeklyActivity[], config:StreakConfig): WeeklyActivity[] {
    return activity.filter((entry) => {
        if (!config.countWeekends && WEEKEND.includes(entry.day)) return false;
        return true;
    });
};

export function calculateCurrentStreak(activity: WeeklyActivity[], config: StreakConfig): number {
    const days = weekendFilter(activity, config);
    let current = 0;
    for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].minutes >= config.minimumActivityMinutes) {
            current++;
        } else {
            break;
        }
    }
    return current;
}

export function calculateLongestStreak(activity: WeeklyActivity[], config: StreakConfig): number {
    const days = weekendFilter(activity, config);
    let longest = 0;
    let meetReq = 0;
    for (const entry of days) {
        if (entry.minutes >= config.minimumActivityMinutes) {
            meetReq++;
            longest = Math.max(longest, meetReq);
        } else {
            meetReq = 0;
        }
    }
    return longest;
}

export function calculateStreak(activity: WeeklyActivity[], config: StreakConfig) : StreakResult {
    return {
        current: calculateCurrentStreak(activity, config),
        longest: calculateLongestStreak(activity, config),
    };
}

const mockConfig: StreakConfig = {
  minimumActivityMinutes: 10,
  countWeekends: true,
};

export const streakResult: StreakResult = calculateStreak(
    mockWeeklyActivity,
    mockConfig
);

console.log("Current streak:", streakResult.current);
console.log("Longest streak:", streakResult.longest);