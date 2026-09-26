"use client"

import { PRESET_CSS_VARS, THEME_PRESETS } from "@/lib/theme/default-theme"

// Inline script to prevent flash of default theme on route/tab navigation.
// Runs before hydration, reads saved preset from localStorage and applies CSS vars synchronously.
export function ThemeInitScript() {
  const presetsJson = JSON.stringify(
    THEME_PRESETS.map((p) => ({
      id: p.id,
      primary: p.theme.primary.color,
      charts: p.theme.charts,
      topbar: p.theme.topbar.background,
      sidebar: p.theme.sidebar.background,
    }))
  )
  const cssVarsJson = JSON.stringify(PRESET_CSS_VARS)

  const scriptContent = `
(function() {
  try {
    var STORAGE_KEY = "dms-theme-config-v1";
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    var theme = JSON.parse(raw);
    if (!theme || !theme.primary || !theme.primary.color) return;
    var presets = ${presetsJson};
    var cssVars = ${cssVarsJson};
    var primary = theme.primary.color;
    var matched = null;
    var matchedPreset = null;
    for (var i = 0; i < presets.length; i++) {
      if (presets[i].primary === primary) { matched = presets[i].id; matchedPreset = presets[i]; break; }
    }
    if (!matched || !cssVars[matched]) return;
    var isDark = false;
    try {
      var storedTheme = localStorage.getItem("theme");
      if (storedTheme === "dark") isDark = true;
      else if (storedTheme === "light") isDark = false;
      else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) isDark = true;
    } catch (e) {}
    var vars = cssVars[matched][isDark ? "dark" : "light"];
    var root = document.documentElement;
    // Background must never change when the theme changes.
    var preserved = { "--background": 1 };
    for (var k in vars) {
      if (Object.prototype.hasOwnProperty.call(vars, k)) {
        if (preserved[k]) continue;
        root.style.setProperty(k, vars[k]);
      }
    }
    if (matchedPreset) {
      // Chart colors always come from CSS vars: explicit --chart-* in the
      // preset var set wins (e.g. royal-indigo dark variants), otherwise the
      // preset's own chart palette. Without a preset, globals.css defaults apply.
      for (var i = 1; i <= 5; i++) {
        var ck = "--chart-" + i;
        var cv = vars[ck];
        if (!cv) {
          var map = { 1: "chart1", 2: "chart2", 3: "chart3", 4: "chart4", 5: "chart5" };
          cv = matchedPreset.charts[map[i]];
        }
        if (cv) root.style.setProperty(ck, cv);
      }
      if (vars["--topbar"]) root.style.setProperty("--topbar-background", vars["--topbar"]);
      if (vars["--sidebar"]) root.style.setProperty("--sidebar-background", vars["--sidebar"]);
    }
  } catch (e) {}
})();
`.trim()

  return (
    <script
      // eslint-disable-next-line @next/next/no-before-interactive-script-outside-document
      dangerouslySetInnerHTML={{ __html: scriptContent }}
      suppressHydrationWarning
    />
  )
}
