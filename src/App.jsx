/* ============================================================
   Ace — app root: state, persistence, theming, settings
   ============================================================ */

import React from "react";
import { Compass } from "./engine/compass";
import { uid } from "./utils";
import { HomeScreen } from "./screens/Home";
import { SetupScreen } from "./screens/Setup";
import { RunScreen } from "./screens/Run";
import { useSettings, SettingsSheet, THEMES, SCALE } from "./settings/settings";

const STORE_KEY = "ace.tournaments.v1";
const SEED_KEY = "ace.seeded.v1";

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch (e) { return []; }
}
function persist(list) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) {}
}

// One-time demo so a first-time visitor lands on a populated, explorable app.
function buildDemo() {
  const C = Compass;
  const names = ["A. Okonkwo", "L. Maher", "K. McKenna", "S. Romano", "Y. Walshe", "R. Maxwell",
    "C. Doyle", "N. Kelly", "H. Lyons", "O. Morgan", "M. O'Meara", "J. O'Connor"];
  const players = names.map((n, i) => ({ id: "dp" + (i + 1), name: n, seed: i + 1 }));
  const draw = C.generateDraw(players);
  let guard = 0;
  const target = Math.round(draw.matchOrder.filter((id) => !draw.matches[id].autoBye).length * 0.62);
  while (guard < target) {
    const ready = C.readyMatches(draw);
    if (!ready.length) break;
    const m = ready[0];
    const va = C.feederValue(draw, m.a), vb = C.feederValue(draw, m.b);
    const sa = +va.slice(2), sb = +vb.slice(2);
    const w = Math.random() < 0.76 ? (sa < sb ? va : vb) : (Math.random() < 0.5 ? va : vb);
    const g = 2 + Math.floor(Math.random() * 4);
    C.applyResult(draw, m.id, w, { sets: [[6, g]] });
    guard++;
  }
  return { id: "demo-" + uid(), name: "Tuesday Club Comp", type: "singles", scoring: "set1", players, draw, done: C.isComplete(draw), created: Date.now(), demo: true };
}

function initialSaved() {
  const existing = loadSaved();
  if (existing.length) return existing;
  try {
    if (!localStorage.getItem(SEED_KEY)) {
      localStorage.setItem(SEED_KEY, "1");
      return [buildDemo()];
    }
  } catch (e) {}
  return [];
}

export default function App() {
  const [settings, setSetting] = useSettings();
  const [saved, setSaved] = React.useState(initialSaved);
  const [screen, setScreen] = React.useState("home");
  const [currentId, setCurrentId] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  React.useEffect(() => { persist(saved); }, [saved]);

  const labelStyle = settings.labels === "Plain" ? "plain" : "compass";
  const theme = THEMES[settings.theme] || THEMES.Optic;

  // Apply theme tokens + dark class on <html> so the desktop backdrop,
  // color-scheme and theme-color all follow along.
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", settings.dark);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--on-accent", theme.on);
    root.style.setProperty("--accent-soft", settings.dark ? theme.softDark : theme.softLight);
    root.style.setProperty("--s", SCALE[settings.textSize] || 1);
    root.style.colorScheme = settings.dark ? "dark" : "light";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", settings.dark ? "#13161c" : "#f5f3ef");
  }, [settings, theme]);

  const current = saved.find((x) => x.id === currentId) || null;

  function startTournament(cfg) {
    const draw = Compass.generateDraw(cfg.players);
    const tourney = { id: uid(), name: cfg.name, type: cfg.type, scoring: cfg.scoring, players: cfg.players, draw, done: false, created: Date.now() };
    setSaved([tourney, ...saved]);
    setCurrentId(tourney.id);
    setScreen("run");
  }
  function updateTournament(next) { setSaved((prev) => prev.map((x) => x.id === next.id ? next : x)); }
  function deleteTournament(id) {
    setSaved((prev) => prev.filter((x) => x.id !== id));
    if (currentId === id) { setCurrentId(null); setScreen("home"); }
  }
  function renameCurrent(name) { updateTournament({ ...current, name }); }

  const openSettings = () => setSettingsOpen(true);

  let body;
  if (screen === "setup") {
    body = <SetupScreen onBack={() => setScreen("home")} onStart={startTournament} />;
  } else if (screen === "run" && current) {
    body = <RunScreen tournament={current} onUpdate={updateTournament}
      onHome={() => setScreen("home")} onDelete={() => deleteTournament(current.id)}
      onRename={renameCurrent} onOpenSettings={openSettings} labelStyle={labelStyle} />;
  } else {
    body = <HomeScreen saved={saved} onNew={() => setScreen("setup")}
      onResume={(id) => { setCurrentId(id); setScreen("run"); }}
      onDelete={deleteTournament} onOpenSettings={openSettings} />;
  }

  return (
    <React.Fragment>
      {body}
      {settingsOpen && (
        <SettingsSheet settings={settings} onChange={setSetting} onClose={() => setSettingsOpen(false)} />
      )}
    </React.Fragment>
  );
}
