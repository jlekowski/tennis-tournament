// Scoring formats — shared by Setup (the picker) and Run (the result sheet).
// `sets` is how many set-score rows the result sheet shows; 0 = tap-winner only.

export const SCORING_OPTS = [
  { value: "quick", label: "Quick", sets: 0, desc: "Just tap the winner — fastest courtside." },
  { value: "s1", label: "1 Set", sets: 1, desc: "A single set — enter the games." },
  { value: "s2", label: "2 Sets", sets: 2, desc: "Up to two sets — enter each set's games." },
  { value: "s3", label: "3 Sets", sets: 3, desc: "Up to three sets — enter each set's games." },
];

const SETS = Object.fromEntries(SCORING_OPTS.map((o) => [o.value, o.sets]));
// Older saved tournaments may still carry the previous scoring keys.
const LEGACY_SETS = { set1: 1, pro: 1, bo3: 3 };

export function setsForScoring(value) {
  return SETS[value] ?? LEGACY_SETS[value] ?? 1;
}
