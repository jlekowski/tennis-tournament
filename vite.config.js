import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Phone-first single-page app. No special config needed beyond JSX support.
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
});
