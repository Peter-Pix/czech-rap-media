export function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

export function formatReadingTime(minutes: number): string {
  if (minutes < 1) return "< 1 min čtení";
  return `${minutes} min čtení`;
}
