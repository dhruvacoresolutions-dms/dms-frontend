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

export function hexToRgb(hex: string): RGB {
  const v = normalizeHex(isValidHex(hex) ? hex : "#000000").slice(1)
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

export function adjustLightness(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, l: clamp(hsl.l + amount) })
}

export function adjustSaturation(hex: string, amount: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, s: clamp(hsl.s + amount) })
}

export function rotateHue(hex: string, degrees: number): string {
  const hsl = hexToHsl(hex)
  return hslToHex({ ...hsl, h: (hsl.h + degrees + 360) % 360 })
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

export function hoverVariant(hex: string, strength = 0.08): string {
  return isDark(hex) ? adjustLightness(hex, strength) : adjustLightness(hex, -strength)
}
