/* ============================================================
   Ace — Setup screen (name / format / scoring / players + seeding)
   ============================================================ */

import React from "react";
import { Icon, Seg, displayName } from "../components/ui";
import { uid } from "../utils";
import { SCORING_OPTS } from "../scoring";

const SAMPLE_NAMES = ["Novak", "Carlos", "Jannik", "Daniil", "Sascha", "Andrey",
  "Stefanos", "Holger", "Casper", "Taylor", "Grigor", "Hubert",
  "Frances", "Ben", "Karen", "Lorenzo"];
const SAMPLE_LAST = ["D.", "A.", "S.", "M.", "Z.", "R.", "T.", "K.", "C.", "F.", "G.", "H.", "B.", "S.", "K.", "M."];

export function SetupScreen({ onBack, onStart }) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState("singles");
  const [scoring, setScoring] = React.useState("quick");
  const [players, setPlayers] = React.useState([]); // {id, name, partner?}
  const [draft, setDraft] = React.useState("");
  const [draft2, setDraft2] = React.useState("");

  const count = players.length;
  const valid = count >= 6 && count <= 16;

  function add() {
    const n = draft.trim();
    if (!n) return;
    if (count >= 16) return;
    const p = { id: uid(), name: n };
    if (type === "doubles" && draft2.trim()) p.partner = draft2.trim();
    setPlayers([...players, p]);
    setDraft(""); setDraft2("");
  }
  function remove(id) { setPlayers(players.filter((p) => p.id !== id)); }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= players.length) return;
    const next = players.slice();
    [next[i], next[j]] = [next[j], next[i]];
    setPlayers(next);
  }
  function shuffle() {
    const next = players.slice();
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    setPlayers(next);
  }
  function sample() {
    const n = 8;
    const ps = [];
    const idx = SAMPLE_NAMES.map((_, i) => i).sort(() => Math.random() - 0.5).slice(0, n);
    idx.forEach((i) => {
      const p = { id: uid(), name: `${SAMPLE_NAMES[i]} ${SAMPLE_LAST[i]}` };
      if (type === "doubles") { const k = (i + 5) % SAMPLE_NAMES.length; p.partner = `${SAMPLE_NAMES[k]} ${SAMPLE_LAST[k]}`; }
      ps.push(p);
    });
    setPlayers(ps);
  }

  function start() {
    const seeded = players.map((p, i) => ({ ...p, seed: i + 1 }));
    onStart({ name: name.trim() || "Club Tournament", type, scoring, players: seeded });
  }

  const unit = type === "doubles" ? "teams" : "players";

  return (
    <div className="ace-root">
      <div className="ace-statusgap" />
      <div className="ace-appbar">
        <button className="ace-iconbtn" onClick={onBack}><Icon name="back" /></button>
        <div className="ace-display" style={{ fontSize: "calc(21px * var(--s))" }}>New tournament</div>
      </div>

      <div className="ace-body ace-enter">
        <div className="ace-pad" style={{ paddingBottom: 20 }}>
          {/* name */}
          <div className="ace-eyebrow" style={{ margin: "8px 0 8px" }}>Name</div>
          <input className="ace-input" placeholder="Saturday Club Comp" value={name}
            onChange={(e) => setName(e.target.value)} />

          {/* format + scoring */}
          <div className="row gap12" style={{ marginTop: 18 }}>
            <div className="grow">
              <div className="ace-eyebrow" style={{ marginBottom: 8 }}>Format</div>
              <Seg value={type} options={[{ value: "singles", label: "Singles" }, { value: "doubles", label: "Doubles" }]}
                onChange={(v) => { setType(v); setPlayers([]); }} />
            </div>
          </div>

          <div className="ace-eyebrow" style={{ margin: "18px 0 8px" }}>Scoring</div>
          <Seg value={scoring} options={SCORING_OPTS.map((o) => ({ value: o.value, label: o.label }))} onChange={setScoring} />
          <div className="muted" style={{ fontSize: "calc(13px * var(--s))", fontWeight: 600, marginTop: 8 }}>
            {SCORING_OPTS.find((o) => o.value === scoring).desc}
          </div>

          {/* players */}
          <div className="row between center" style={{ margin: "26px 0 8px" }}>
            <div className="ace-eyebrow">{unit} · seeding order</div>
            <div className="ace-num" style={{ fontSize: "calc(14px * var(--s))", color: valid ? "var(--win)" : "var(--muted)" }}>
              {count}/16
            </div>
          </div>

          {/* add row */}
          <div className="col gap8">
            {type === "doubles" ? (
              <div className="row gap8">
                <input className="ace-input" placeholder="Player A" value={draft}
                  onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
                <input className="ace-input" placeholder="Player B" value={draft2}
                  onChange={(e) => setDraft2(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
              </div>
            ) : (
              <input className="ace-input" placeholder="Add player name…" value={draft}
                onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} />
            )}
            <div className="row gap8">
              <button className="ace-btn ace-btn--primary grow" onClick={add} disabled={!draft.trim() || count >= 16}
                style={{ height: "calc(48px * var(--s))" }}>
                <Icon name="plus" size={20} /> Add
              </button>
              {count >= 2 && (
                <button className="ace-btn ace-btn--ghost" onClick={shuffle} style={{ height: "calc(48px * var(--s))" }}>
                  <Icon name="shuffle" size={18} /> Shuffle
                </button>
              )}
            </div>
          </div>

          {count === 0 && (
            <button onClick={sample} className="muted"
              style={{ marginTop: 14, fontSize: "calc(13.5px * var(--s))", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>
              or add 8 sample {unit} to explore
            </button>
          )}

          {/* list */}
          <div className="col gap8" style={{ marginTop: 16 }}>
            {players.map((p, i) => (
              <div key={p.id} className="ace-prow ace-enter">
                <span className="ace-seed" style={{ background: i < 2 ? "var(--accent)" : "var(--surface-sunk)", color: i < 2 ? "var(--on-accent)" : "var(--muted)" }}>{i + 1}</span>
                <span className="grow" style={{ fontWeight: 700, fontSize: "calc(15.5px * var(--s))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {displayName(p)}
                </span>
                <button className="ace-iconbtn" style={{ width: 34, height: 34 }} onClick={() => move(i, -1)} disabled={i === 0}>
                  <Icon name="up" size={16} />
                </button>
                <button className="ace-iconbtn" style={{ width: 34, height: 34 }} onClick={() => move(i, 1)} disabled={i === players.length - 1}>
                  <Icon name="down" size={16} />
                </button>
                <button className="ace-iconbtn" style={{ width: 34, height: 34, color: "var(--muted)" }} onClick={() => remove(p.id)}>
                  <Icon name="close" size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="muted" style={{ fontSize: "calc(12.5px * var(--s))", fontWeight: 600, marginTop: 14, textAlign: "center" }}>
            Top of the list is seed #1. {count > 8 ? "Draws of 9–16 use a 16-spot draw, so top seeds may get byes." : "6–8 fills an 8-spot draw."}
          </div>
        </div>
      </div>

      {/* sticky CTA */}
      <div style={{ flex: "none", padding: "10px 18px 30px", background: "var(--bg)", borderTop: "1px solid var(--line)" }}>
        <button className="ace-btn ace-btn--accent ace-btn--block ace-btn--lg" disabled={!valid} onClick={start}>
          {valid ? <React.Fragment><Icon name="bolt" size={20} fill /> Generate draw</React.Fragment>
            : `Add ${count < 6 ? 6 - count + " more" : "fewer"} ${unit}`}
        </button>
      </div>
    </div>
  );
}
