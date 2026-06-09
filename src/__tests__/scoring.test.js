import { describe, it, expect } from "vitest";
import { SCORING_OPTS, setsForScoring } from "../scoring.js";

describe("scoring config", () => {
  it("offers Quick plus 1/2/3 sets and no pro set", () => {
    expect(SCORING_OPTS.map((o) => o.value)).toEqual(["quick", "s1", "s2", "s3"]);
    expect(SCORING_OPTS.map((o) => o.label)).toEqual(["Quick", "1 Set", "2 Sets", "3 Sets"]);
  });

  it("maps each format to the number of set-score rows", () => {
    expect(setsForScoring("quick")).toBe(0);
    expect(setsForScoring("s1")).toBe(1);
    expect(setsForScoring("s2")).toBe(2);
    expect(setsForScoring("s3")).toBe(3);
  });

  it("understands legacy scoring keys from older saved tournaments", () => {
    expect(setsForScoring("set1")).toBe(1);
    expect(setsForScoring("pro")).toBe(1);
    expect(setsForScoring("bo3")).toBe(3);
    expect(setsForScoring("anything-else")).toBe(1);
  });
});
