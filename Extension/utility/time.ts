export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === 0) return "--:--";
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0)
    return `${hrs}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function parseTime(input: string): number | null {
  if (!input.trim()) return null;
  const parts = input
    .trim()
    .split(":")
    .filter(p => p.length > 0);
  const nums = parts.map(p => parseFloat(p));
  if (nums.some(isNaN)) return null;
  if (nums.length === 1) return nums[0];
  if (nums.length === 2) return nums[0] * 60 + nums[1];
  if (nums.length === 3) return nums[0] * 3600 + nums[1] * 60 + nums[2];
  return null;
}
