import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App.jsx";

// Each test starts from a clean slate so the first-run demo re-seeds.
beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
  document.documentElement.removeAttribute("style");
});
afterEach(() => cleanup());

describe("App", () => {
  it("renders the home screen with the brand and the seeded demo tournament", () => {
    render(<App />);
    expect(screen.getByText("Ace")).toBeInTheDocument();
    expect(screen.getByText("Tuesday Club Comp")).toBeInTheDocument();
    expect(screen.getByText("New tournament")).toBeInTheDocument();
  });

  it("opens settings, toggles dark mode, and persists the choice", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "Settings" }));
    expect(screen.getByText("Dark mode")).toBeInTheDocument();
    expect(screen.getByText(/Bracket labels/)).toBeInTheDocument();

    await user.click(screen.getByRole("switch"));
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(JSON.parse(localStorage.getItem("ace.settings.v1")).dark).toBe(true);

    await user.click(screen.getByRole("button", { name: "Close settings" }));
    expect(screen.queryByText(/Bracket labels/)).not.toBeInTheDocument();
  });

  it("resumes the demo and switches between the run-screen tabs", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText("Tuesday Club Comp"));
    // Run screen: bottom tab bar
    expect(screen.getByText("Up Next")).toBeInTheDocument();
    expect(screen.getByText("Draw")).toBeInTheDocument();
    expect(screen.getByText("Standings")).toBeInTheDocument();

    // Draw tab → compass sub-draws (East is always the main draw)
    await user.click(screen.getByText("Draw"));
    expect(screen.getAllByText(/East/).length).toBeGreaterThan(0);

    // Standings tab → final standings list with per-player W-L / sets / games
    await user.click(screen.getByText("Standings"));
    expect(screen.getByText(/Final standings/)).toBeInTheDocument();
    expect(screen.getAllByText(/W-L/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/games/).length).toBeGreaterThan(0);
  });

  it("starts a new tournament from home and shows the setup screen", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText("New tournament"));
    expect(screen.getByText("Scoring")).toBeInTheDocument();
    expect(screen.getByText(/seeding order/)).toBeInTheDocument();
  });

  it("records up to three sets when the 3 Sets format is chosen", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText("New tournament"));
    await user.click(screen.getByText(/add 8 sample/i)); // fill 8 players
    await user.click(screen.getByText("3 Sets")); // pick 3-set scoring
    await user.click(screen.getByText("Generate draw"));

    // Open the first ready match's result sheet → three set rows
    await user.click(screen.getAllByText("Enter result")[0]);
    expect(screen.getByText("SET 1")).toBeInTheDocument();
    expect(screen.getByText("SET 2")).toBeInTheDocument();
    expect(screen.getByText("SET 3")).toBeInTheDocument();
  });
});
