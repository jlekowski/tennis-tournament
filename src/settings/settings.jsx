/* ============================================================
   Ace — Settings: theming tokens, persistence hook, settings sheet.

   This replaces the design prototype's host-driven "Tweaks" panel
   with a real in-app settings sheet, persisted to localStorage.
   Same user-facing options: accent theme, dark mode, text size,
   bracket labels.
   ============================================================ */

import React from "react";
import { Icon, Seg, Toggle } from "../components/ui";

export const THEMES = {
  Optic: { accent: "#bde342", on: "#1a2029", softLight: "#f4fbe1", softDark: "#424d2f" },
  Court: { accent: "#2b7ec9", on: "#ffffff", softLight: "#ddeaf6", softDark: "#22374d" },
  Clay: { accent: "#d66b36", on: "#ffffff", softLight: "#f8e7df", softDark: "#47332d" },
  Grass: { accent: "#3b834e", on: "#ffffff", softLight: "#e0ebe3", softDark: "#253832" },
};
export const SCALE = { Small: 0.92, Regular: 1, Large: 1.12, "X-Large": 1.24 };

const SETTINGS_KEY = "ace.settings.v1";
const SETTINGS_DEFAULTS = { theme: "Optic", textSize: "Regular", labels: "Compass", dark: false };

function loadSettings() {
  try {
    return { ...SETTINGS_DEFAULTS, ...(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}) };
  } catch (e) {
    return { ...SETTINGS_DEFAULTS };
  }
}

// Single source of truth for settings; persists every change.
export function useSettings() {
  const [settings, setSettings] = React.useState(loadSettings);
  const set = React.useCallback((key, val) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: val };
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)); } catch (e) {}
      return next;
    });
  }, []);
  return [settings, set];
}

function Field({ label, children }) {
  return (
    <div className="col" style={{ gap: 8, marginBottom: 16 }}>
      <div className="ace-eyebrow">{label}</div>
      {children}
    </div>
  );
}

export function SettingsSheet({ settings, onChange, onClose }) {
  return (
    <div className="ace-overlay">
      <div className="ace-scrim" onClick={onClose} />
      <div className="ace-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="ace-grab" />
        <div className="row between center" style={{ marginBottom: 18 }}>
          <div className="ace-display" style={{ fontSize: "calc(22px * var(--s))" }}>Settings</div>
          <button className="ace-iconbtn" onClick={onClose} aria-label="Close settings">
            <Icon name="close" size={18} />
          </button>
        </div>

        <Field label="Accent">
          <Seg value={settings.theme} options={["Optic", "Court", "Clay", "Grass"]}
            onChange={(v) => onChange("theme", v)} />
        </Field>

        <div className="row between center" style={{ marginBottom: 18 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "calc(15px * var(--s))" }}>Dark mode</div>
            <div className="muted" style={{ fontSize: "calc(12.5px * var(--s))", fontWeight: 600 }}>Easier on the eyes indoors</div>
          </div>
          <Toggle value={settings.dark} onChange={(v) => onChange("dark", v)} />
        </div>

        <Field label="Text size">
          <Seg value={settings.textSize} options={["Small", "Regular", "Large", "X-Large"]}
            onChange={(v) => onChange("textSize", v)} />
        </Field>
        <div className="muted" style={{ fontSize: "calc(12px * var(--s))", fontWeight: 600, marginTop: -8, marginBottom: 18 }}>
          Bump it up for sunlight legibility courtside.
        </div>

        <Field label="Bracket labels">
          <Seg value={settings.labels} options={["Compass", "Plain"]}
            onChange={(v) => onChange("labels", v)} />
        </Field>
        <div className="muted" style={{ fontSize: "calc(12px * var(--s))", fontWeight: 600, marginTop: -8 }}>
          Compass uses East / West / North / South. Plain uses Main / Plate / Cup / Shield.
        </div>
      </div>
    </div>
  );
}
