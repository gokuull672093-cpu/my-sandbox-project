/** Soft pastel tint behind each category icon (matches the illustrated icon row). */
const TINTS = [
  "bg-rose-50",
  "bg-amber-50",
  "bg-emerald-50",
  "bg-sky-50",
  "bg-violet-50",
  "bg-orange-50",
];

export const categoryTint = (index: number) => TINTS[index % TINTS.length]!;
