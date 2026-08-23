export interface ThemeConfig {
  topbar: {
    background: string
  }
  sidebar: {
    background: string
  }
  primary: {
    color: string
  }
  charts: {
    chart1: string
    chart2: string
    chart3: string
    chart4: string
    chart5: string
  }
}

export interface ThemeStorage {
  getTheme(): ThemeConfig | null
  saveTheme(theme: ThemeConfig): void
  clearTheme(): void
}
