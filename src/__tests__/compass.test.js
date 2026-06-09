import { describe, it, expect } from "vitest";
import { Compass } from "../engine/compass.js";

// ---- Helpers ----

function makePlayers(n) {
  return Array.from({ length: n }, (_, i) => ({ id: "p" + i, name: "P" + i, seed: i + 1 }));
}

// Play out a whole draw, choosing winners with `pick(va, vb) -> winnerId`.
function playOut(draw, pick) {
  let guard = 0;
  while (!Compass.isComplete(draw) && guard < 1000) {
    const ready = Compass.readyMatches(draw);
    if (!ready.length) break;
    const m = ready[0];
    const va = Compass.feederValue(draw, m.a);
    const vb = Compass.feederValue(draw, m.b);
    Compass.applyResult(draw, m.id, pick(va, vb), null);
    guard++;
  }
  return draw;
}

// ---- bracketSize ----

describe("bracketSize", () => {
  it("rounds up to a power of two, minimum 8", () => {
    expect(Compass.bracketSize(6)).toBe(8);
    expect(Compass.bracketSize(8)).toBe(8);
    expect(Compass.bracketSize(9)).toBe(16);
    expect(Compass.bracketSize(16)).toBe(16);
  });
});

// ---- seedOrder ----

describe("seedOrder", () => {
  it("is a permutation that keeps the top two seeds in opposite halves", () => {
    const order = Compass.seedOrder(8);
    expect(order).toHaveLength(8);
    expect(order[0]).toBe(1); // top seed at the top
    // every seed appears exactly once
    expect([...order].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    // #1 and #2 sit in opposite halves, so they can't meet before the final
    const half = order.length / 2;
    expect(order.indexOf(1)).toBeLessThan(half);
    expect(order.indexOf(2)).toBeGreaterThanOrEqual(half);
  });
});

// ---- generateDraw + byes ----

describe("generateDraw", () => {
  it("seeds players by array order into the bracket slots", () => {
    const players = makePlayers(8);
    const draw = Compass.generateDraw(players);
    expect(draw.size).toBe(8);
    expect(draw.slotPlayer[0]).toBe("p0"); // seed #1 at the top slot
    // seeds #1 and #2 land in opposite halves of the draw
    const half = draw.slotPlayer.length / 2;
    expect(draw.slotPlayer.slice(0, half)).toContain("p0");
    expect(draw.slotPlayer.slice(half)).toContain("p1");
  });

  it("auto-resolves byes for awkward counts and advances the top seed", () => {
    const players = makePlayers(12); // 12 -> 16-spot draw -> 4 byes for top seeds
    const draw = Compass.generateDraw(players);
    expect(draw.size).toBe(16);
    const byeMatches = draw.matchOrder.map((id) => draw.matches[id]).filter((m) => m.autoBye);
    expect(byeMatches.length).toBeGreaterThan(0);
    // seed #1 (players[0]) gets a first-round bye and is carried through
    const firstRoundForSeed1 = draw.matchOrder
      .map((id) => draw.matches[id])
      .find((m) => m.round === 1 && m.a.type === "slot" && draw.slotPlayer[m.a.pos] === "p0");
    expect(firstRoundForSeed1.autoBye).toBe(true);
    expect(firstRoundForSeed1.winner).toBe("p0");
  });
});

// ---- applyResult + standings ----

describe("applyResult / standings", () => {
  it("records the winner, loser and score", () => {
    const draw = Compass.generateDraw(makePlayers(8));
    const m = Compass.readyMatches(draw)[0];
    const va = Compass.feederValue(draw, m.a);
    const vb = Compass.feederValue(draw, m.b);
    Compass.applyResult(draw, m.id, va, { sets: [[6, 3]] });
    expect(draw.matches[m.id].winner).toBe(va);
    expect(draw.matches[m.id].loser).toBe(vb);
    expect(draw.matches[m.id].score).toEqual({ sets: [[6, 3]] });
  });

  it("throws if the winner is not one of the two competitors", () => {
    const draw = Compass.generateDraw(makePlayers(8));
    const m = Compass.readyMatches(draw)[0];
    expect(() => Compass.applyResult(draw, m.id, "not-a-player", null)).toThrow();
  });

  it("crowns the stronger seed as champion when the favourite always wins", () => {
    const players = makePlayers(8);
    const draw = Compass.generateDraw(players);
    // lower seed index == stronger; favourite is the smaller id suffix
    playOut(draw, (va, vb) => (+va.slice(1) < +vb.slice(1) ? va : vb));
    expect(Compass.isComplete(draw)).toBe(true);
    expect(Compass.standings(draw)[0]).toEqual({ rank: 1, playerId: "p0" });
  });
});

// ---- clearResult (undo) ----

describe("clearResult", () => {
  it("undoes a result and any downstream consequences", () => {
    const draw = Compass.generateDraw(makePlayers(8));
    const m = Compass.readyMatches(draw)[0];
    const va = Compass.feederValue(draw, m.a);
    Compass.applyResult(draw, m.id, va, null);
    expect(draw.matches[m.id].winner).toBe(va);

    Compass.clearResult(draw, m.id);
    expect(draw.matches[m.id].winner).toBeUndefined();
    expect(Compass.isPlayable(draw, draw.matches[m.id])).toBe(true);
  });

  it("preserves unrelated explicit results when undoing one match", () => {
    const draw = Compass.generateDraw(makePlayers(8));
    const ready = Compass.readyMatches(draw);
    const [m1, m2] = ready;
    const w1 = Compass.feederValue(draw, m1.a);
    const w2 = Compass.feederValue(draw, m2.a);
    Compass.applyResult(draw, m1.id, w1, null);
    Compass.applyResult(draw, m2.id, w2, null);
    Compass.clearResult(draw, m1.id);
    expect(draw.matches[m1.id].winner).toBeUndefined();
    expect(draw.matches[m2.id].winner).toBe(w2); // untouched
  });
});

// ---- stress: every count 6–16 always completes with a valid ranking ----

describe("compass draw integrity (random play-throughs)", () => {
  it("always completes and produces a valid #1..#N permutation for 6–16 players", () => {
    let trials = 0;
    for (let n = 6; n <= 16; n++) {
      for (let t = 0; t < 150; t++) {
        trials++;
        const draw = Compass.generateDraw(makePlayers(n));
        playOut(draw, (va, vb) => (Math.random() < 0.5 ? va : vb));
        expect(Compass.isComplete(draw)).toBe(true);
        const st = Compass.standings(draw);
        const ranks = st.map((s) => s.rank);
        expect(st).toHaveLength(n); // everyone ranked
        expect(new Set(ranks).size).toBe(n); // ranks unique
        expect(ranks.every((r) => r >= 1 && r <= n)).toBe(true); // valid permutation
      }
    }
    expect(trials).toBe(11 * 150);
  });
});
