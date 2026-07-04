/* ============================================================
   Ace — Home screen (resume / start / completed list)
   ============================================================ */

import React from "react";
import { Compass } from "../engine/compass";
import { Icon, BrandMark, displayName } from "../components/ui";

export function HomeScreen({ saved, onNew, onResume, onDelete, onOpenSettings }) {
  const live = saved.filter((t) => !t.done);
  const done = saved.filter((t) => t.done);
  return (
    <div className="ace-root">
      <div className="ace-statusgap" />
      <div className="ace-body ace-enter">
        <div className="ace-pad" style={{ paddingTop: 8 }}>
          <div className="row between center" style={{ marginBottom: 4 }}>
            <div className="row center gap10">
              <BrandMark size={34} />
              <div className="ace-display" style={{ fontSize: "calc(34px * var(--s))" }}>Ace</div>
            </div>
            <button className="ace-iconbtn" onClick={onOpenSettings} aria-label="Settings">
              <Icon name="gear" size={20} />
            </button>
          </div>
          <div className="muted" style={{ fontSize: "calc(15px * var(--s))", fontWeight: 600, marginBottom: 26 }}>
            Run a compass-draw tournament from your pocket.
          </div>

          {live.length > 0 && (
            <React.Fragment>
              <div className="ace-eyebrow" style={{ marginBottom: 10 }}>In progress</div>
              <div className="col gap10" style={{ marginBottom: 26 }}>
                {live.map((t) => <SavedCard key={t.id} t={t} onResume={onResume} onDelete={onDelete} />)}
              </div>
            </React.Fragment>
          )}

          <button className="ace-btn ace-btn--primary ace-btn--block ace-btn--lg" onClick={onNew}>
            <Icon name="plus" size={22} /> New tournament
          </button>

          {done.length > 0 && (
            <React.Fragment>
              <div className="ace-eyebrow" style={{ margin: "30px 0 10px" }}>Completed</div>
              <div className="col gap10">
                {done.map((t) => <SavedCard key={t.id} t={t} onResume={onResume} onDelete={onDelete} />)}
              </div>
            </React.Fragment>
          )}

          <div className="ace-footer">
            <span>Made by</span>
            <a href="https://lekowski.dev" target="_blank" rel="noopener noreferrer">Jerzy Lekowski</a>
            <span>·</span>
            <a href="https://github.com/jlekowski/tennis-tournament" target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function SavedCard({ t, onResume, onDelete }) {
  const total = t.draw.matchOrder.filter((id) => {
    const m = t.draw.matches[id];
    return !m.autoBye;
  }).length;
  const played = t.draw.matchOrder.filter((id) => {
    const m = t.draw.matches[id];
    return m.winner !== undefined && !m.autoBye;
  }).length;
  const pct = total ? Math.round((played / total) * 100) : 0;
  const champ = t.done ? Compass.standings(t.draw)[0] : null;
  return (
    <div className="ace-card" style={{ padding: 14 }} onClick={() => onResume(t.id)}>
      <div className="row between center">
        <div className="grow">
          <div style={{ fontWeight: 800, fontSize: "calc(17px * var(--s))" }}>{t.name}</div>
          <div className="muted row gap8 center" style={{ fontSize: "calc(13px * var(--s))", fontWeight: 600, marginTop: 2 }}>
            <span>{t.players.length} {t.type === "doubles" ? "teams" : "players"}</span>
            <span className="faint">•</span>
            {t.done
              ? <span style={{ color: "var(--win)" }}>Won by {displayName(t.players.find((p) => p.id === champ.playerId))}</span>
              : <span>{played}/{total} matches</span>}
          </div>
        </div>
        <button className="ace-iconbtn" onClick={(e) => { e.stopPropagation(); onDelete(t.id); }}
          style={{ width: 38, height: 38, color: "var(--muted)" }}>
          <Icon name="trash" size={18} />
        </button>
      </div>
      {!t.done && (
        <div style={{ height: 6, borderRadius: 3, background: "var(--surface-sunk)", marginTop: 12, overflow: "hidden" }}>
          <div style={{ height: "100%", width: pct + "%", background: "var(--accent)", borderRadius: 3, transition: "width .3s" }} />
        </div>
      )}
    </div>
  );
}
