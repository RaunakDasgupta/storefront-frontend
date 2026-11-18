import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Tailwind v4 runs as a Vite plugin: no tailwind.config.js and no PostCSS setup. The theme lives in src/index.css.
export default defineConfig({ plugins: [react(), tailwindcss()] });
