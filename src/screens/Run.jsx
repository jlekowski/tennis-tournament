/* ============================================================
   Ace — Run screens: Up Next, Draw, Standings, Result sheet
   ============================================================ */

import React from "react";
import { Compass } from "../engine/compass";
import { Icon, Seed, SubPill, Sheet, Stepper, subMeta, displayName } from "../components/ui";
import { setsForScoring } from "../scoring";

function resolveSide(draw, feeder, labelStyle) {
  const C = Compass;
  const v = C.feederValue(draw, feeder);
  if (v === null) return { kind: "bye" };
  if (v === undefined) {
    if (feeder.type === "slot") return { kind: "bye" };
    const src = draw.matches[feeder.matchId];
    const m = subMeta(src.subKey, labelStyle);
    return { kind: "pending", text: (feeder.type === "winner" ? "Winner" : "Loser") + " · " + m.name + " R" + src.round, color: m.color };
  }
  return { kind: "player", player: draw.players.find((x) => x.id === v) };
}

function sideGames(match, sideIsWinner) {
  if (!match.score || !match.score.sets || !match.score.sets.length) return null;
  return match.score.sets.map((s) => (sideIsWinner ? s[0] : s[1]));
}

// ---- one competitor row ----
function SideRow({ side, isWinner, hasResult, games, big }) {
  let cls = "ace-side";
  if (hasResult) cls += isWinner ? " win" : " lose";
  const nameStyle = { fontSize: big ? "calc(16.5px * var(--s))" : "calc(14.5px * var(--s))" };
  return (
    <div className={cls} style={big ? null : { padding: "calc(10px * var(--s)) 12px" }}>
      {side.kind === "player" ? <Seed n={side.player.seed} dim={hasResult && !isWinner} /> : <span className="ace-seed" style={{ opacity: 0.4 }}>–</span>}
      <span className="nm" style={nameStyle}>
        {side.kind === "player" ? displayName(side.player)
          : side.kind === "bye" ? <span className="faint">Bye</span>
            : <span style={{ color: side.color, fontWeight: 700, fontSize: "calc(12.5px * var(--s))" }}>{side.text}</span>}
      </span>
      {hasResult && isWinner && <Icon name="check" size={16} style={{ color: "var(--win)", flex: "none" }} sw={3} />}
      {games && <span className="row gap6" style={{ flex: "none" }}>
        {games.map((g, i) => <span key={i} className="sc">{g}</span>)}
      </span>}
    </div>
  );
}

// ---- match card (full = up next, mini = bracket) ----
function MatchCard({ draw, match, labelStyle, variant, onTap }) {
  const a = resolveSide(draw, match.a, labelStyle);
  const b = resolveSide(draw, match.b, labelStyle);
  const hasResult = match.winner !== undefined && !match.autoBye;
  const winId = match.winner;
  const aWin = a.kind === "player" && a.player.id === winId;
  const bWin = b.kind === "player" && b.player.id === winId;
  const playable = Compass.isPlayable(draw, match);
  const big = variant === "full";

  const card = (
    <div className="ace-match" style={big ? null : { minWidth: 184, borderColor: playable ? "var(--accent)" : "var(--line)" }}>
      <SideRow side={a} isWinner={aWin} hasResult={hasResult} games={hasResult ? sideGames(match, aWin) : null} big={big} />
      <SideRow side={b} isWinner={bWin} hasResult={hasResult} games={hasResult ? sideGames(match, bWin) : null} big={big} />
    </div>
  );

  if (big) {
    return (
      <div className="ace-card ace-enter" style={{ padding: 13, borderColor: "var(--line)" }}>
        <div className="row between center" style={{ marginBottom: 10 }}>
          <SubPill subKey={match.subKey} labelStyle={labelStyle} />
          <span className="ace-eyebrow">Round {match.round}</span>
        </div>
        {card}
        <button className="ace-btn ace-btn--primary ace-btn--block" style={{ marginTop: 11, height: "calc(48px * var(--s))" }} onClick={onTap}>
          <Icon name="flag" size={18} /> Enter result
        </button>
      </div>
    );
  }
  return <div onClick={playable || hasResult ? onTap : undefined} style={{ cursor: playable || hasResult ? "pointer" : "default" }}>{card}</div>;
}

// ---- UP NEXT ----
function UpNextView({ draw, labelStyle, onPick }) {
  const C = Compass;
  const ready = C.readyMatches(draw);
  const complete = C.isComplete(draw);
  const champ = complete ? C.standings(draw)[0] : null;

  if (complete) {
    const cp = draw.players.find((p) => p.id === champ.playerId);
    return (
      <div className="ace-pad ace-enter" style={{ paddingTop: 30, textAlign: "center" }}>
        <div style={{ display: "inline-flex", width: 92, height: 92, borderRadius: "50%", background: "var(--accent)", color: "var(--on-accent)", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
          <Icon name="star" size={46} fill />
        </div>
        <div className="ace-eyebrow" style={{ marginBottom: 6 }}>Tournament complete</div>
        <div className="ace-display" style={{ fontSize: "calc(30px * var(--s))", marginBottom: 6 }}>{displayName(cp)}</div>
        <div className="muted" style={{ fontWeight: 600 }}>is your champion. Check the full standings →</div>
      </div>
    );
  }

  if (ready.length === 0) {
    return (
      <div className="ace-pad ace-enter" style={{ paddingTop: 40, textAlign: "center" }}>
        <div className="muted" style={{ fontWeight: 700, fontSize: "calc(16px * var(--s))" }}>No matches ready right now.</div>
        <div className="faint" style={{ fontWeight: 600, marginTop: 6 }}>Enter results from the current round to unlock the next matches.</div>
      </div>
    );
  }

  return (
    <div className="ace-pad" style={{ paddingTop: 6 }}>
      <div className="row between center" style={{ margin: "4px 2px 12px" }}>
        <div className="ace-eyebrow">Ready to play</div>
        <div className="ace-num" style={{ fontSize: "calc(14px * var(--s))", color: "var(--accent)" }}>{ready.length}</div>
      </div>
      <div className="col gap12">
        {ready.map((m) => <MatchCard key={m.id} draw={draw} match={m} labelStyle={labelStyle} variant="full" onTap={() => onPick(m.id)} />)}
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}

// ---- DRAW (compass brackets) ----
function DrawView({ draw, labelStyle, onPick }) {
  // sub-draw keys present, ordered by best rank within
  const keys = {};
  draw.matchOrder.forEach((id) => {
    const m = draw.matches[id];
    (keys[m.subKey] = keys[m.subKey] || []).push(m);
  });
  // order by minimum possible rank in sub-draw
  function minRank(k) {
    const ms = keys[k];
    let mn = Infinity;
    ms.forEach((m) => { if (m.winnerRank) mn = Math.min(mn, m.winnerRank); });
    return mn === Infinity ? 999 : mn;
  }
  const order = Object.keys(keys).sort((a, b) => minRank(a) - minRank(b));

  return (
    <div style={{ paddingTop: 6 }}>
      {order.map((k) => <SubDraw key={k} sk={k} matches={keys[k]} draw={draw} labelStyle={labelStyle} onPick={onPick} />)}
      <div style={{ height: 16 }} />
    </div>
  );
}

function SubDraw({ sk, matches, draw, labelStyle, onPick }) {
  const m = subMeta(sk, labelStyle);
  const rounds = [...new Set(matches.map((x) => x.round))].sort((a, b) => a - b);
  const finalRound = rounds[rounds.length - 1];
  // ranks awarded by this sub-draw
  const fm = matches.filter((x) => x.round === finalRound);
  const lo = Math.min(...fm.map((x) => x.winnerRank));
  const hi = Math.max(...fm.map((x) => x.loserRank));

  return (
    <div className="ace-enter" style={{ marginBottom: 22 }}>
      <div className="ace-pad row between center" style={{ marginBottom: 10 }}>
        <div className="row gap8 center">
          <span className="ace-dot" style={{ background: m.color, width: 11, height: 11 }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: "calc(16px * var(--s))", whiteSpace: "nowrap" }}>{m.name}</div>
            <div className="muted" style={{ fontSize: "calc(12px * var(--s))", fontWeight: 600, whiteSpace: "nowrap" }}>{m.full}</div>
          </div>
        </div>
        <span className="ace-pill" style={{ background: "var(--surface-sunk)", color: "var(--muted)" }}>#{lo}–#{hi}</span>
      </div>

      <div style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: 6 }}>
        <div className="row" style={{ gap: 16, padding: "0 18px", alignItems: "stretch", minWidth: "min-content" }}>
          {rounds.map((r) => {
            const col = matches.filter((x) => x.round === r).sort((a, b) => a.idxInGroup - b.idxInGroup);
            return (
              <div key={r} className="col" style={{ justifyContent: "space-around", gap: 12, flex: "none" }}>
                <div className="ace-eyebrow" style={{ marginBottom: 2 }}>R{r}</div>
                {col.map((mt) => (
                  <div key={mt.id} className="col gap6" style={{ flex: 1, justifyContent: "center" }}>
                    <MatchCard draw={draw} match={mt} labelStyle={labelStyle} variant="mini" onTap={() => onPick(mt.id)} />
                    {r === finalRound && <RankRow match={mt} draw={draw} />}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RankRow({ match, draw }) {
  function nm(id) { const p = draw.players.find((x) => x.id === id); return p ? displayName(p) : null; }
  const w = match.winner !== undefined ? nm(match.winner) : null;
  const l = match.winner !== undefined ? nm(match.loser) : null;
  return (
    <div className="col gap6" style={{ paddingLeft: 2 }}>
      <div className="row gap6 center"><span className="ace-medal" style={{ color: "var(--accent)", fontSize: "calc(12px * var(--s))" }}>#{match.winnerRank}</span>
        <span className="faint" style={{ fontSize: "calc(11.5px * var(--s))", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w || "—"}</span></div>
      <div className="row gap6 center"><span className="ace-medal muted" style={{ fontSize: "calc(12px * var(--s))" }}>#{match.loserRank}</span>
        <span className="faint" style={{ fontSize: "calc(11.5px * var(--s))", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l || "—"}</span></div>
    </div>
  );
}

// ---- STANDINGS ----
const EMPTY_STAT = { matchesWon: 0, matchesLost: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0 };

function StatLine({ st, anyGames }) {
  return (
    <div className="ace-num muted" style={{ fontSize: "calc(11.5px * var(--s))", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
      {st.matchesWon}–{st.matchesLost}<span className="faint"> W-L</span>
      {anyGames && (
        <React.Fragment>
          <span className="faint"> · </span>{st.setsWon}–{st.setsLost}<span className="faint"> sets</span>
          <span className="faint"> · </span>{st.gamesWon}–{st.gamesLost}<span className="faint"> games</span>
        </React.Fragment>
      )}
    </div>
  );
}

function StandingsView({ draw }) {
  const C = Compass;
  const placed = C.standings(draw);
  const stats = C.playerStats(draw);
  const anyGames = Object.values(stats).some((s) => s.gamesWon + s.gamesLost > 0);
  const n = draw.players.length;
  const rows = [];
  for (let r = 1; r <= n; r++) {
    const s = placed.find((x) => x.rank === r);
    rows.push({ rank: r, player: s ? draw.players.find((p) => p.id === s.playerId) : null });
  }
  const medalColor = (r) => r === 1 ? "var(--accent)" : r === 2 ? "var(--faint)" : r === 3 ? "var(--sd-south)" : "var(--surface-sunk)";

  return (
    <div className="ace-pad" style={{ paddingTop: 8 }}>
      <div className="ace-eyebrow" style={{ margin: "2px 2px 12px" }}>Final standings · {placed.length}/{n} decided</div>
      <div className="col gap8">
        {rows.map(({ rank, player }) => {
          const top3 = rank <= 3 && player;
          return (
            <div key={rank} className="ace-card row center gap12" style={{ padding: "10px 14px", borderColor: rank === 1 && player ? "var(--accent)" : "var(--line)", background: rank === 1 && player ? "var(--accent-soft)" : "var(--surface)" }}>
              <span className="ace-medal" style={{ width: 30, textAlign: "center", fontSize: "calc(19px * var(--s))", color: top3 ? medalColor(rank) : "var(--faint)" }}>{rank}</span>
              {player ? (
                <React.Fragment>
                  <div className="grow col" style={{ minWidth: 0, gap: 2 }}>
                    <div className="row center gap8" style={{ minWidth: 0 }}>
                      <span style={{ fontWeight: 800, fontSize: "calc(16px * var(--s))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>{displayName(player)}</span>
                      {rank === 1 && <Icon name="star" size={18} fill style={{ color: "var(--accent)", flex: "none" }} />}
                    </div>
                    <StatLine st={stats[player.id] || EMPTY_STAT} anyGames={anyGames} />
                  </div>
                  <Seed n={player.seed} />
                </React.Fragment>
              ) : (
                <span className="grow faint" style={{ fontWeight: 700, fontSize: "calc(14px * var(--s))" }}>To be decided</span>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ height: 16 }} />
    </div>
  );
}

// ---- RESULT SHEET ----
function ResultSheet({ draw, matchId, scoring, labelStyle, onConfirm, onUndo, onClose }) {
  const match = draw.matches[matchId];
  const a = resolveSide(draw, match.a, labelStyle);
  const b = resolveSide(draw, match.b, labelStyle);
  const pA = a.player, pB = b.player;
  const existing = match.winner !== undefined && !match.autoBye;

  const nSets = setsForScoring(scoring);
  const usesScore = nSets > 0;
  const [winner, setWinner] = React.useState(existing ? match.winner : null);
  const [ret, setRet] = React.useState(existing && match.score && match.score.ret || false);
  // sets stored as [gamesA, gamesB] per set (oriented to competitor A/B)
  const [sets, setSets] = React.useState(() => {
    if (existing && match.score && match.score.sets) {
      const aWin = match.winner === pA.id;
      return match.score.sets.map((s) => aWin ? [s[0], s[1]] : [s[1], s[0]]);
    }
    return Array.from({ length: nSets }, () => [0, 0]);
  });

  function pickBtn(p, isWin) {
    return (
      <button onClick={() => setWinner(p.id)}
        style={{
          flex: 1, textAlign: "left", padding: "16px 16px", borderRadius: 16,
          border: "2px solid " + (isWin ? "var(--accent)" : "var(--line)"),
          background: isWin ? "var(--accent-soft)" : "var(--surface)",
          transition: "all .15s ease",
        }}>
        <div className="row center gap10">
          <Seed n={p.seed} />
          <span className="grow" style={{ fontWeight: 800, fontSize: "calc(16px * var(--s))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayName(p)}</span>
          {isWin && <Icon name="check" size={20} sw={3} style={{ color: "var(--win)" }} />}
        </div>
      </button>
    );
  }

  function buildScore() {
    if (!usesScore) return null;
    const used = sets.filter((s) => s[0] || s[1]);
    if (!used.length && !ret) return null;
    const aWin = winner === pA.id;
    return { ret, sets: used.map((s) => aWin ? [s[0], s[1]] : [s[1], s[0]]) };
  }

  return (
    <Sheet onClose={onClose}>
      <div className="row between center" style={{ marginBottom: 14 }}>
        <SubPill subKey={match.subKey} labelStyle={labelStyle} />
        <span className="ace-eyebrow">Round {match.round} · tap the winner</span>
      </div>

      <div className="col gap10">
        {pickBtn(pA, winner === pA.id)}
        {pickBtn(pB, winner === pB.id)}
      </div>

      {usesScore && (
        <div style={{ marginTop: 18 }}>
          <div className="ace-eyebrow" style={{ marginBottom: 10 }}>Games {nSets > 1 ? "(per set)" : ""}</div>
          <div className="col gap10">
            {sets.slice(0, nSets).map((s, i) => (
              <div key={i} className="row center between" style={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 13, padding: "8px 12px" }}>
                <span className="ace-num muted" style={{ width: 46, fontSize: "calc(12px * var(--s))" }}>{nSets > 1 ? "SET " + (i + 1) : "GAMES"}</span>
                <div className="row center gap10">
                  <div className="col center" style={{ gap: 2 }}>
                    <Stepper value={s[0]} onChange={(v) => { const ns = sets.slice(); ns[i] = [v, s[1]]; setSets(ns); }} max={20} />
                  </div>
                  <span className="faint ace-num">:</span>
                  <Stepper value={s[1]} onChange={(v) => { const ns = sets.slice(); ns[i] = [s[0], v]; setSets(ns); }} max={20} />
                </div>
              </div>
            ))}
          </div>
          <div className="row center gap8" style={{ marginTop: 4, justifyContent: "flex-end" }}>
            <span className="faint" style={{ fontSize: "calc(11px * var(--s))", fontWeight: 700 }}>left = top player</span>
          </div>
        </div>
      )}

      <button onClick={() => setRet(!ret)} className="row center gap8" style={{ marginTop: 14, width: "100%", justifyContent: "center", padding: "10px", borderRadius: 12, background: ret ? "var(--danger-soft)" : "var(--surface-sunk)", color: ret ? "var(--danger)" : "var(--muted)", fontWeight: 700, fontSize: "calc(13px * var(--s))" }}>
        <Icon name="retire" size={16} /> {ret ? "Marked: opponent retired" : "Opponent retired / walkover"}
      </button>

      <div className="row gap10" style={{ marginTop: 16 }}>
        {existing && <button className="ace-btn ace-btn--soft" onClick={onUndo} style={{ flex: "none", paddingLeft: 18, paddingRight: 18 }}><Icon name="trash" size={18} /></button>}
        <button className="ace-btn ace-btn--accent grow ace-btn--lg" disabled={!winner} onClick={() => onConfirm(winner, buildScore())}>
          {existing ? "Update result" : "Confirm result"}
        </button>
      </div>
    </Sheet>
  );
}

// ---- RUN CONTAINER ----
export function RunScreen({ tournament, onUpdate, onHome, onDelete, onRename, onOpenSettings, labelStyle }) {
  const C = Compass;
  const [tab, setTab] = React.useState("next");
  const [pick, setPick] = React.useState(null); // matchId
  const [menu, setMenu] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const draw = tournament.draw;

  const total = draw.matchOrder.filter((id) => !draw.matches[id].autoBye).length;
  const played = draw.matchOrder.filter((id) => { const m = draw.matches[id]; return m.winner !== undefined && !m.autoBye; }).length;
  const ready = C.readyMatches(draw).length;
  const complete = C.isComplete(draw);

  function confirm(winnerId, score) {
    C.applyResult(draw, pick, winnerId, score);
    onUpdate({ ...tournament, draw, done: C.isComplete(draw) });
    setPick(null);
  }
  function undo() {
    C.clearResult(draw, pick);
    onUpdate({ ...tournament, draw, done: C.isComplete(draw) });
    setPick(null);
  }

  const TABS = [
    { id: "next", icon: "list", label: "Up Next", badge: complete ? null : ready || null },
    { id: "draw", icon: "grid", label: "Draw" },
    { id: "rank", icon: "podium", label: "Standings" },
  ];

  return (
    <div className="ace-root">
      <div className="ace-statusgap" />
      <div className={"ace-appbar" + (scrolled ? " scrolled" : "")}>
        <button className="ace-iconbtn" onClick={onHome}><Icon name="home" size={20} /></button>
        <div className="grow" style={{ minWidth: 0 }}>
          <div className="ace-display" style={{ fontSize: "calc(18px * var(--s))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tournament.name}</div>
          <div className="muted" style={{ fontSize: "calc(12px * var(--s))", fontWeight: 700 }}>
            {complete ? "Complete" : `${played}/${total} matches · ${tournament.players.length} ${tournament.type === "doubles" ? "teams" : "players"}`}
          </div>
        </div>
        <button className="ace-iconbtn" onClick={() => setMenu(true)}><Icon name="dots" size={20} /></button>
      </div>

      {/* progress bar */}
      <div style={{ flex: "none", height: 3, background: "var(--surface-sunk)" }}>
        <div style={{ height: "100%", width: (total ? (played / total) * 100 : 0) + "%", background: "var(--accent)", transition: "width .35s ease" }} />
      </div>

      <div className="ace-body" onScroll={(e) => setScrolled(e.target.scrollTop > 4)}>
        {tab === "next" && <UpNextView draw={draw} labelStyle={labelStyle} onPick={setPick} />}
        {tab === "draw" && <DrawView draw={draw} labelStyle={labelStyle} onPick={setPick} />}
        {tab === "rank" && <StandingsView draw={draw} />}
      </div>

      <div className="ace-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={"ace-tab" + (tab === t.id ? " on" : "")} onClick={() => setTab(t.id)}>
            {t.badge ? <span className="ace-tab-badge">{t.badge}</span> : null}
            <Icon name={t.icon} size={23} fill={tab === t.id} sw={tab === t.id ? 0 : 2} />
            {t.label}
          </button>
        ))}
      </div>

      {pick && <ResultSheet draw={draw} matchId={pick} scoring={tournament.scoring} labelStyle={labelStyle}
        onConfirm={confirm} onUndo={undo} onClose={() => setPick(null)} />}

      {menu && (
        <Sheet onClose={() => setMenu(false)}>
          <div className="col gap8" style={{ paddingBottom: 6 }}>
            <button className="ace-btn ace-btn--ghost ace-btn--block" style={{ justifyContent: "flex-start", height: "calc(54px * var(--s))" }}
              onClick={() => { const n = prompt("Tournament name", tournament.name); if (n) onRename(n.trim()); setMenu(false); }}>
              <Icon name="edit" size={20} /> Rename tournament
            </button>
            <button className="ace-btn ace-btn--ghost ace-btn--block" style={{ justifyContent: "flex-start", height: "calc(54px * var(--s))" }}
              onClick={() => { setMenu(false); onOpenSettings(); }}>
              <Icon name="gear" size={20} /> Settings
            </button>
            <button className="ace-btn ace-btn--ghost ace-btn--block" style={{ justifyContent: "flex-start", height: "calc(54px * var(--s))" }}
              onClick={() => { onHome(); }}>
              <Icon name="home" size={20} /> Back to home
            </button>
            <button className="ace-btn ace-btn--ghost ace-btn--block" style={{ justifyContent: "flex-start", height: "calc(54px * var(--s))", color: "var(--danger)" }}
              onClick={() => { setMenu(false); onDelete(); }}>
              <Icon name="trash" size={20} /> Delete tournament
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}
