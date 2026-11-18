// Light or dark mode. The choice is a `dark` class on <html> (index.html sets it before the first paint, so there is no flash),
// remembered in localStorage. Until someone picks, the system setting decides and is followed live.
import { useSyncExternalStore } from "react";
import { browserStorage } from "./api/kv";

export type Theme = "light" | "dark";
const KEY = "storefront.theme";

const root = () => document.documentElement;
const saved = (): Theme | null => {
  try { const v = browserStorage("local").getItem(KEY); return v === "light" || v === "dark" ? v : null; } catch { return null; }
};
const systemTheme = (): Theme => (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");

function apply(theme: Theme) { root().classList.toggle("dark", theme === "dark"); }

/** The person's choice, if they made one. */
export function setTheme(theme: Theme) {
  apply(theme);
  try { browserStorage("local").setItem(KEY, theme); } catch { /* private mode: the choice lasts until reload */ }
}

/** Starts following the system setting while no choice is saved. Returns the cleanup. */
export function followSystemTheme() {
  apply(saved() ?? systemTheme());
  const query = window.matchMedia?.("(prefers-color-scheme: dark)");
  const onChange = () => { if (!saved()) apply(systemTheme()); };
  query?.addEventListener("change", onChange);
  return () => query?.removeEventListener("change", onChange);
}

const subscribe = (notify: () => void) => {
  const observer = new MutationObserver(notify);
  observer.observe(root(), { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};
const current = (): Theme => (root().classList.contains("dark") ? "dark" : "light");

/** The current theme, and a function that flips it. */
export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(subscribe, current, () => "light" as Theme);
  return [theme, () => setTheme(theme === "dark" ? "light" : "dark")];
}
