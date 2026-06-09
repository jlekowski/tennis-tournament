// Small shared helpers.

// Short, collision-unlikely id for tournaments / players.
export function uid() {
  return Math.random().toString(36).slice(2, 9);
}
