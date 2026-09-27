export interface RGB {
  r: number
  g: number
  b: number
}
export interface HSL {
  h: number
  s: number
  l: number
}

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v))

export function isValidHex(value: string): boolean {
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim())
}

export function normalizeHex(value: string): string {
  let v = value.trim().replace(/^#/, "")
  if (v.length === 3)
    v = v
      .split("")
      .map((c) => c + c)
      .join("")
  return `#${v.toLowerCase()}`
}

export interface OKLCH {
  l: number
  c: number
  h: number
}

const OKLCH_RE =
  /^oklch\(\s*([+-]?\d*\.?\d+%?)\s+([+-]?\d*\.?\d+%?)\s+([+-]?\d*\.?\d+(?:deg)?)(?:\s*\/\s*[+-]?\d*\.?\d+%?)?\s*\)$/i

/**
 * Default/preset themes store colors as `oklch(...)` strings, but derivation
 * works in sRGB. Parse `oklch(L C H)` (alpha, when present, is ignored).
 */
export function parseOklch(value: string): OKLCH | null {
  const m = OKLCH_RE.exec(value.trim())
  if (!m) return null
  const component = (raw: string, isLightness: boolean) => {
    if (raw.endsWith("%")) return parseFloat(raw) / 100
    const v = parseFloat(raw)
    // Tolerate 0-100 lightness written without a % sign.
    return isLightness && v > 1 ? v / 100 : v
  }
  const l = component(m[1], true)
  const c = component(m[2], false)
  const h = parseFloat(m[3])
  if ([l, c, h].some((v) => Number.isNaN(v))) return null
  return { l, c, h }
}

function oklchToLinearSrgb({ l, c, h }: OKLCH): RGB {
  const rad = (h * Math.PI) / 180
  const a = c * Math.cos(rad)
  const b = c * Math.sin(rad)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.2914855480 * b
  const l3 = l_ ** 3
  const m3 = m_ ** 3
  const s3 = s_ ** 3
  return {
    r: 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  }
}

/** Convert any supported color string (hex or oklch) to sRGB hex. */
export function toHex(value: string): string {
  if (isValidHex(value)) return normalizeHex(value)
  const oklch = parseOklch(value)
  if (oklch) {
    const lin = oklchToLinearSrgb(oklch)
    const gamma = (c: number) => {
      // Clamp the low end pre-gamma: out-of-gamut negatives would NaN via pow.
      // The high end is clamped by rgbToHex.
      const v = Math.max(0, c)
      return v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055
    }
    return rgbToHex({
      r: gamma(lin.r) * 255,
      g: gamma(lin.g) * 255,
      b: gamma(lin.b) * 255,
    })
  }
  return "#000000"
}

export function hexToRgb(hex: string): RGB {
  const v = toHex(hex).slice(1)
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  }
}

export function rgbToHex({ r, g, b }: RGB): string {
  const to = (n: number) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, "0")
  return `#${to(r)}${to(g)}${to(b)}`
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255
  const gn = g / 255
  const bn = b / 255
  const max = Math.max(rn, gn, bn)
  const min = Math.min(rn, gn, bn)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6
    else if (max === gn) h = (bn - rn) / d + 2
    else h = (rn - gn) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const l = (max + min) / 2
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
  return { h, s, l }
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (((h % 360) + 360) % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let rgb: [number, number, number] = [0, 0, 0]
  if (hp < 1) rgb = [c, x, 0]
  else if (hp < 2) rgb = [x, c, 0]
  else if (hp < 3) rgb = [0, c, x]
  else if (hp < 4) rgb = [0, x, c]
  else if (hp < 5) rgb = [x, 0, c]
  else rgb = [c, 0, x]
  const m = l - c / 2
  return {
    r: (rgb[0] + m) * 255,
    g: (rgb[1] + m) * 255,
    b: (rgb[2] + m) * 255,
  }
}

export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex))
}
export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl))
}

export function adjustSaturation(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, s: clamp(hsl.s + amount) })
}

export function mix(a: string, b: string, weight: number): string {
  const w = clamp(weight)
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  return rgbToHex({
    r: ca.r + (cb.r - ca.r) * w,
    g: ca.g + (cb.g - ca.g) * w,
    b: ca.b + (cb.b - ca.b) * w,
  })
}

export function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex)
  const ch = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b)
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

export function isDark(hex: string): boolean {
  return relativeLuminance(hex) < 0.4
}

export function readableForeground(background: string): string {
  const hsl = hexToHsl(background)
  const light = hslToHex({ h: hsl.h, s: Math.min(hsl.s, 0.25), l: 0.97 })
  const dark = hslToHex({ h: hsl.h, s: Math.min(hsl.s, 0.35), l: 0.12 })
  const pick = contrastRatio(background, light) >= contrastRatio(background, dark) ? light : dark
  if (contrastRatio(background, pick) >= 4.5) return pick
  return contrastRatio(background, "#ffffff") >= contrastRatio(background, "#000000")
    ? "#ffffff"
    : "#000000"
}
