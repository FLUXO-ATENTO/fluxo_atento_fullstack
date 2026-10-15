export type PaletteId = 'brand' | 'ocean' | 'forest' | 'violet' | 'custom'
export interface PalettePreference { id: PaletteId; primary?: string; accent?: string }

export const interfacePalettes = [
  { id: 'brand', name: 'Fluxo Atento', description: 'Padrão da marca', primary: '#eaa176', accent: '#8abda5' },
  { id: 'ocean', name: 'Oceano', description: 'Azul e turquesa', primary: '#5399e8', accent: '#35b5ad' },
  { id: 'forest', name: 'Botânico', description: 'Verde e dourado', primary: '#69b58b', accent: '#c7a458' },
  { id: 'violet', name: 'Violeta', description: 'Violeta e rosa', primary: '#aa8be8', accent: '#df8bb6' }
] as const

export function hexColor(value: unknown): string | null {
  return typeof value === 'string' && /^#[\da-f]{6}$/i.test(value) ? value.toLowerCase() : null
}

/** Display preferences only: no CSS, URLs, roles or arbitrary metadata accepted. */
export function normalizePalette(value: unknown): PalettePreference {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { id: 'brand' }
  const data = value as Record<string, unknown>
  if (interfacePalettes.some(p => p.id === data.id)) return { id: data.id as PaletteId }
  if (data.id === 'custom') {
    const primary = hexColor(data.primary); const accent = hexColor(data.accent)
    if (primary && accent) return { id: 'custom', primary, accent }
  }
  return { id: 'brand' }
}

function channels(hex: string): number[] { return [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)) }
function luminance(hex: string): number {
  const c = channels(hex).map(v => { const s = v / 255; return s <= .04045 ? s / 12.92 : ((s + .055) / 1.055) ** 2.4 })
  return .2126 * c[0]! + .7152 * c[1]! + .0722 * c[2]!
}
export function contrastRatio(a: string, b: string): number {
  const x = luminance(a); const y = luminance(b)
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05)
}
function mix(hex: string, toward: number, amount: number): string {
  return '#' + channels(hex).map(v => Math.round(v + (toward - v) * amount).toString(16).padStart(2, '0')).join('')
}
export function readableColor(hex: string, theme: 'light' | 'dark'): string {
  // Use the least favorable surface in the palette; preserve a margin for tinted selections.
  const background = theme === 'light' ? '#f0f2f5' : '#202123'
  let color = hexColor(hex) || '#eaa176'
  for (let i = 0; i < 40 && contrastRatio(color, background) < 5.5; i++) color = mix(color, theme === 'light' ? 0 : 255, .08)
  return color
}
export function paletteVariables(input: unknown, theme: 'light' | 'dark'): Record<string, string> {
  const palette = normalizePalette(input)
  // No override at all for the original brand, including its original hover/soft colors.
  if (palette.id === 'brand') return {}
  const preset = interfacePalettes.find(p => p.id === palette.id)
  const primary = readableColor(preset?.primary || palette.primary!, theme)
  const accent = readableColor(preset?.accent || palette.accent!, theme)
  const onPrimary = contrastRatio(primary, '#ffffff') >= contrastRatio(primary, '#090a0b') ? '#ffffff' : '#090a0b'
  return {
    '--brand': primary, '--brand-soft': `color-mix(in srgb, ${primary} 9%, var(--surface-1))`,
    '--ui-primary': primary, '--workspace-accent': accent,
    '--button-on-primary': onPrimary,
    '--button-primary-hover': mix(primary, theme === 'light' ? 0 : 255, .12)
  }
}
