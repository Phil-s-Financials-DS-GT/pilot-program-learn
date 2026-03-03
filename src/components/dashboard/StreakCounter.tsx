type StreakCounterProps = {
  current: number;
  longest: number;
};

export function StreakCounter({ current, longest }: StreakCounterProps) {
  return (
    <div>
      <h2>Streak</h2>
      <p>Current Streak: {current} days</p>
      <p>Longest Streak: {longest} days</p>
    </div>
  );
}