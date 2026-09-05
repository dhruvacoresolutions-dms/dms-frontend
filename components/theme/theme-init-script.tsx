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
    for (var k in vars) {
      if (Object.prototype.hasOwnProperty.call(vars, k)) {
        root.style.setProperty(k, vars[k]);
      }
    }
    if (matchedPreset) {
      root.style.setProperty("--chart-1", matchedPreset.charts.chart1);
      root.style.setProperty("--chart-2", matchedPreset.charts.chart2);
      root.style.setProperty("--chart-3", matchedPreset.charts.chart3);
      root.style.setProperty("--chart-4", matchedPreset.charts.chart4);
      root.style.setProperty("--chart-5", matchedPreset.charts.chart5);
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
