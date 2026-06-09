/* ============================================================
   Ace — shared UI primitives, icons, helpers
   ============================================================ */

import React from "react";
import { Compass } from "../engine/compass";

// ---- icons (simple stroke set) -------------------------------------------
const ICONS = {
  plus: "M12 5v14M5 12h14",
  back: "M15 19l-7-7 7-7",
  chevR: "M9 6l6 6-6 6",
  chevD: "M6 9l6 6 6-6",
  close: "M6 6l12 12M18 6L6 18",
  check: "M5 12.5l4.5 4.5L19 7",
  shuffle: "M16 3h5v5M21 3l-7.5 7.5M4 20l6-6M4 4l5 5M16 21h5v-5M14 14l7 7",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
  up: "M12 19V5M6 11l6-6 6 6",
  down: "M12 5v14M18 13l-6 6-6-6",
  flag: "M5 21V4M5 4l6-1 5 2 4-1v10l-4 1-5-2-6 1",
  edit: "M4 20h4L18 10l-4-4L4 16v4zM14 6l4 4",
  list: "M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01",
  grid: "M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z",
  podium: "M9 21V9h6v12M3 21v-7h6M15 14h6v7",
  bolt: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
  dots: "M6 12h.01M12 12h.01M18 12h.01",
  home: "M4 11l8-7 8 7M6 10v10h12V10",
  retire: "M18 6L6 18M6 6l12 12",
  star: "M12 3l2.7 5.8 6.3.8-4.6 4.3 1.2 6.3L12 17.6 6.4 20.5l1.2-6.3L3 9.9l6.3-.8z",
  cal: "M4 6h16v15H4zM4 10h16M8 3v4M16 3v4",
  gear: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z M19.4 12c0-.5-.05-1-.13-1.5l1.86-1.45-1.8-3.12-2.2.9c-.78-.63-1.66-1.12-2.62-1.43L14.2 3h-4.4l-.31 2.4c-.96.31-1.84.8-2.62 1.43l-2.2-.9-1.8 3.12L4.73 10.5c-.08.5-.13 1-.13 1.5s.05 1 .13 1.5L2.87 14.95l1.8 3.12 2.2-.9c.78.63 1.66 1.12 2.62 1.43L9.8 21h4.4l.31-2.4c.96-.31 1.84-.8 2.62-1.43l2.2.9 1.8-3.12-1.86-1.45c.08-.5.13-1 .13-1.5z",
};

export function Icon({ name, size = 22, sw = 2, fill = false, style }) {
  const d = ICONS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}
      stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} fill={fill ? "currentColor" : "none"} stroke={fill ? "none" : "currentColor"} />
    </svg>
  );
}

// brand mark — abstract tennis ball seam (allowed: circle + a curve)
export function BrandMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ display: "block" }}>
      <circle cx="16" cy="16" r="14" fill="var(--accent)" />
      <path d="M6 9c5 3 5 11 0 14M26 9c-5 3-5 11 0 14" stroke="var(--on-accent)" strokeOpacity="0.55"
        strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ---- sub-draw metadata ----------------------------------------------------
const SUB_VARS = {
  "": "--sd-east", L: "--sd-west", WL: "--sd-north", LL: "--sd-south",
  WWL: "--sd-ne", WLL: "--sd-nw", LWL: "--sd-sw", LLL: "--sd-se",
};
const SUB_PLAIN = {
  "": { name: "Main", full: "Championship draw" },
  L: { name: "Plate", full: "1st-round consolation" },
  WL: { name: "Cup", full: "2nd-round consolation" },
  LL: { name: "Shield", full: "Lower consolation" },
  WWL: { name: "Cup B", full: "Quarter consolation" },
  WLL: { name: "Bowl", full: "Consolation" },
  LWL: { name: "Bowl B", full: "Consolation" },
  LLL: { name: "Shield B", full: "Bottom consolation" },
};

export function subMeta(subKey, labelStyle) {
  const C = Compass.SUBDRAW_NAMES[subKey] || { name: subKey, full: "", short: subKey };
  const colorVar = SUB_VARS[subKey] || "--muted";
  if (labelStyle === "plain") {
    const p = SUB_PLAIN[subKey] || C;
    return { name: p.name, full: p.full, color: `var(${colorVar})`, short: C.short };
  }
  return { name: C.name, full: C.full, color: `var(${colorVar})`, short: C.short };
}

export function displayName(player) {
  if (!player) return "—";
  if (player.partner) return `${player.name} / ${player.partner}`;
  return player.name;
}

// ---- small components -----------------------------------------------------
export function SubPill({ subKey, labelStyle, withName = true }) {
  const m = subMeta(subKey, labelStyle);
  return (
    <span className="ace-pill" style={{ background: "var(--surface-sunk)", color: m.color }}>
      <span className="ace-dot" style={{ background: m.color }} />
      {withName && m.name}
    </span>
  );
}

export function Seed({ n, dim }) {
  if (n == null) return null;
  return <span className="ace-seed" style={dim ? { opacity: 0.5 } : null}>{n}</span>;
}

export function Seg({ value, options, onChange }) {
  return (
    <div className="ace-seg">
      {options.map((o) => {
        const val = typeof o === "string" ? o : o.value;
        const label = typeof o === "string" ? o : o.label;
        return (
          <button key={val} className={val === value ? "on" : ""} onClick={() => onChange(val)}>{label}</button>
        );
      })}
    </div>
  );
}

export function Stepper({ value, onChange, min = 0, max = 99 }) {
  return (
    <div className="ace-step">
      <button onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className="val">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

// iOS-style switch — used for boolean settings (dark mode).
export function Toggle({ value, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={!!value} onClick={() => onChange(!value)}
      style={{
        width: 50, height: 30, borderRadius: 999, flex: "none", position: "relative",
        background: value ? "var(--accent)" : "var(--surface-sunk)",
        border: "1px solid var(--line)", transition: "background .18s ease",
      }}>
      <span style={{
        position: "absolute", top: 2, left: value ? 21 : 2,
        width: 24, height: 24, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,.3)", transition: "left .18s ease",
      }} />
    </button>
  );
}

export function Sheet({ children, onClose }) {
  return (
    <React.Fragment>
      <div className="ace-scrim" onClick={onClose} />
      <div className="ace-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ace-grab" />
        {children}
      </div>
    </React.Fragment>
  );
}
