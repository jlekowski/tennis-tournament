/* ============================================================
   Compass Draw engine — pure logic, no UI.
   Exposes `Compass = { generateDraw, applyResult, ... }`.

   Ported verbatim from the stress-tested design prototype
   (3,300 random play-throughs, 6–16 players, zero failures).
   ============================================================ */

// Next power of two >= n, minimum 8 (so 6/7/8 -> 8, 9..16 -> 16).
function bracketSize(n) {
  let b = 2;
  while (b < n) b *= 2;
  return Math.max(b, 2);
}

// Standard single-elimination seed positions for a power-of-two bracket.
// Returns array of seed numbers (1-based) in slot order, top -> bottom.
function seedOrder(b) {
  let order = [1, 2];
  while (order.length < b) {
    const sum = order.length * 2 + 1;
    const next = [];
    for (const x of order) {
      next.push(x);
      next.push(sum - x);
    }
    order = next;
  }
  return order;
}

// binary value of a W/L path, W=0 L=1, first char = most significant bit.
function pathRank(path) {
  let v = 0;
  for (const c of path) v = v * 2 + (c === "L" ? 1 : 0);
  return v + 1; // rank is 1-based
}

// sub-draw key = prefix with trailing 'W' removed ("" === East main draw)
function subDrawKey(prefix) {
  let p = prefix;
  while (p.endsWith("W")) p = p.slice(0, -1);
  return p;
}

// Friendly names for each sub-draw key.
const SUBDRAW_NAMES = {
  "": { name: "East", full: "Main Draw", short: "E" },
  L: { name: "West", full: "Consolation", short: "W" },
  WL: { name: "North", full: "2nd-round Plate", short: "N" },
  LL: { name: "South", full: "Lower Plate", short: "S" },
  WWL: { name: "Northeast", full: "Quarter Plate", short: "NE" },
  WLL: { name: "Northwest", full: "Plate", short: "NW" },
  LWL: { name: "Southwest", full: "Plate", short: "SW" },
  LLL: { name: "Southeast", full: "Bottom Plate", short: "SE" },
};

// Build the static match graph for a bracket of size b (power of two).
// Returns { rounds, size, matches: [...] }
// Each match: { id, prefix, round, idxInGroup, a, b, subKey,
//               winnerRank|null, loserRank|null }   (ranks only on final round)
// a / b are "feeders": {type:'slot', pos} | {type:'winner'|'loser', matchId}
function buildGraph(b) {
  const R = Math.log2(b);
  const matches = [];
  let groups = { "": Array.from({ length: b }, (_, i) => ({ type: "slot", pos: i })) };
  let mid = 0;

  for (let d = 0; d < R; d++) {
    const newGroups = {};
    for (const prefix of Object.keys(groups)) {
      const members = groups[prefix];
      const winners = [];
      const losers = [];
      for (let j = 0; j < members.length; j += 2) {
        const id = "M" + mid++;
        const isFinal = d === R - 1;
        const m = {
          id,
          prefix,
          round: d + 1,
          idxInGroup: j / 2,
          a: members[j],
          b: members[j + 1],
          subKey: subDrawKey(prefix),
          winnerRank: isFinal ? pathRank(prefix + "W") : null,
          loserRank: isFinal ? pathRank(prefix + "L") : null,
        };
        matches.push(m);
        winners.push({ type: "winner", matchId: id });
        losers.push({ type: "loser", matchId: id });
      }
      if (d < R - 1) {
        newGroups[prefix + "W"] = winners;
        newGroups[prefix + "L"] = losers;
      }
    }
    groups = newGroups;
  }
  return { rounds: R, size: b, matches };
}

// ---- A live draw instance bound to players -----------------------------

// players: array of { id, name, partner?, seed } already ordered by seed (index 0 = #1).
// Returns a draw state object.
function generateDraw(players) {
  const n = players.length;
  const b = bracketSize(n);
  const graph = buildGraph(b);
  const order = seedOrder(b); // seed numbers in slot order

  // slot -> player (by seed) or BYE
  const slotPlayer = order.map((seedNum) => (seedNum <= n ? players[seedNum - 1].id : null));

  const matchMap = {};
  for (const m of graph.matches) matchMap[m.id] = { ...m, winner: undefined, loser: undefined, score: null, autoBye: false };

  const draw = {
    size: b,
    rounds: graph.rounds,
    players,
    slotPlayer, // index by slot pos -> playerId | null(bye)
    matchOrder: graph.matches.map((m) => m.id),
    matches: matchMap,
    placements: {}, // rank -> playerId
  };

  resolveByes(draw);
  return draw;
}

// resolve a feeder to a concrete playerId | null(bye) | undefined(unknown yet)
function feederValue(draw, f) {
  if (f.type === "slot") return draw.slotPlayer[f.pos]; // playerId | null
  const src = draw.matches[f.matchId];
  if (!src || src.winner === undefined) return undefined;
  return f.type === "winner" ? src.winner : src.loser;
}

function bothKnown(draw, m) {
  return feederValue(draw, m.a) !== undefined && feederValue(draw, m.b) !== undefined;
}

// A match is a real, playable match (both sides are real players)
function isPlayable(draw, m) {
  if (m.winner !== undefined) return false;
  const va = feederValue(draw, m.a);
  const vb = feederValue(draw, m.b);
  return va !== undefined && vb !== undefined && va !== null && vb !== null;
}

// Auto-complete any match where at least one side is a BYE (and the other is known).
function resolveByes(draw) {
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of draw.matchOrder) {
      const m = draw.matches[id];
      if (m.winner !== undefined) continue;
      if (!bothKnown(draw, m)) continue;
      const va = feederValue(draw, m.a);
      const vb = feederValue(draw, m.b);
      if (va === null || vb === null) {
        // at least one bye -> auto resolve
        m.winner = va !== null ? va : vb; // could be null if both byes
        m.loser = va !== null ? vb : va;
        m.autoBye = true;
        changed = true;
        assignPlacement(draw, m);
      }
    }
  }
}

function assignPlacement(draw, m) {
  if (m.winnerRank != null && m.winner != null) draw.placements[m.winnerRank] = m.winner;
  if (m.loserRank != null && m.loser != null) draw.placements[m.loserRank] = m.loser;
}

// Record a result: winnerId must be one of the two real competitors.
function applyResult(draw, matchId, winnerId, score) {
  const m = draw.matches[matchId];
  if (!m) throw new Error("no match " + matchId);
  const va = feederValue(draw, m.a);
  const vb = feederValue(draw, m.b);
  if (winnerId !== va && winnerId !== vb) throw new Error("winner not in match");
  m.winner = winnerId;
  m.loser = winnerId === va ? vb : va;
  m.score = score || null;
  m.autoBye = false;
  assignPlacement(draw, m);
  resolveByes(draw); // downstream byes
  return draw;
}

// Undo a result (and any downstream results that depended on it).
function clearResult(draw, matchId) {
  // reset this match and recompute everything from scratch by replaying explicit results.
  const explicit = {};
  for (const id of draw.matchOrder) {
    const m = draw.matches[id];
    if (m.winner !== undefined && !m.autoBye && id !== matchId) explicit[id] = { winner: m.winner, score: m.score };
  }
  // rebuild
  const fresh = generateDraw(draw.players);
  // replay in match order
  let progress = true;
  const pending = { ...explicit };
  while (progress) {
    progress = false;
    for (const id of Object.keys(pending)) {
      const m = fresh.matches[id];
      if (isPlayable(fresh, m)) {
        applyResult(fresh, id, pending[id].winner, pending[id].score);
        delete pending[id];
        progress = true;
      }
    }
  }
  // copy back
  draw.matches = fresh.matches;
  draw.placements = fresh.placements;
  return draw;
}

// matches ready to play right now
function readyMatches(draw) {
  return draw.matchOrder.map((id) => draw.matches[id]).filter((m) => isPlayable(draw, m));
}

function playerName(draw, id) {
  if (id == null) return null;
  const p = draw.players.find((x) => x.id === id);
  return p ? p.name : "?";
}

// competitor display for a feeder (resolved player or a "waiting on" label)
function feederLabel(draw, f) {
  const v = feederValue(draw, f);
  if (v === null) return { kind: "bye", text: "Bye" };
  if (v !== undefined) return { kind: "player", playerId: v };
  // unknown — describe source
  if (f.type === "slot") return { kind: "bye", text: "Bye" };
  const src = draw.matches[f.matchId];
  return { kind: "pending", text: (f.type === "winner" ? "Winner " : "Loser ") + shortMatchLabel(draw, src) };
}

function shortMatchLabel(draw, m) {
  return "of R" + m.round;
}

function isComplete(draw) {
  return Object.keys(draw.placements).length >= draw.players.length;
}

// standings: array of {rank, playerId} for ranks that are filled by real players, sorted
function standings(draw) {
  const out = [];
  for (let r = 1; r <= draw.size; r++) {
    const pid = draw.placements[r];
    if (pid != null) out.push({ rank: r, playerId: pid });
  }
  return out;
}

export const Compass = {
  bracketSize,
  seedOrder,
  buildGraph,
  generateDraw,
  applyResult,
  clearResult,
  readyMatches,
  isPlayable,
  feederValue,
  feederLabel,
  playerName,
  standings,
  isComplete,
  SUBDRAW_NAMES,
  subDrawKey,
  pathRank,
};
