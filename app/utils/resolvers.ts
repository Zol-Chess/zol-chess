export function difficultyLabel(rating: number): string {
  if (rating < 1000) return "NOVICE";
  if (rating < 1400) return "INTERMEDIATE";
  if (rating < 1800) return "ADVANCED";
  if (rating < 2200) return "EXPERT";
  return "MASTER";
}
