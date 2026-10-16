import { normalizePalette, type PalettePreference } from './interface-palette.ts'

/** Display-only profile. Never derive authorization from editable user metadata. */
export interface AuthProfile {
  id: string
  email?: string
  displayName: string
  contactPhone: string
  tourVersion: number
  palette: PalettePreference
}

export function displayProfile(value: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null): AuthProfile | null {
  if (!value) return null
  const metadata = value.user_metadata || {}
  const text = (key: string, max: number) => typeof metadata[key] === 'string' ? (metadata[key] as string).trim().slice(0, max) : ''
  return {
    id: value.id, email: value.email,
    displayName: text('full_name', 120) || text('name', 120),
    contactPhone: text('contact_phone', 40),
    tourVersion: Number.isSafeInteger(metadata.fluxo_tour_version) ? Number(metadata.fluxo_tour_version) : 0,
    palette: normalizePalette(metadata.fluxo_palette)
  }
}

export function profileGreeting(profile: AuthProfile | null): string {
  const name = profile?.displayName.trim().split(/\s+/)[0]
  return name ? `Olá, ${name}` : 'Boas-vindas'
}

export function roleLabel(platformAdmin: boolean, platformArea: boolean, role?: string) {
  if (platformArea && platformAdmin) return 'Superadmin'
  if (role === 'owner') return 'Responsável pela empresa'
  if (role === 'admin') return 'Admin da empresa'
  return 'Membro da empresa'
}

export interface RecentPage { path: string; label: string }
export function addRecentPage(pages: RecentPage[], page: RecentPage): RecentPage[] {
  // Only known navigation entries are passed here, never query strings or user-entered URLs.
  if (!page.path.startsWith('/') || /[?#]/.test(page.path)) return pages
  return [page, ...pages.filter(item => item.path !== page.path)].slice(0, 5)
}

export function resolveTheme(value: unknown): 'light' | 'dark' | 'system' {
  return value === 'light' || value === 'system' ? value : 'dark'
}

export const growthSteps = [
  { id: 'connect', title: 'Conectar Meta ou Google', description: 'Autorize a leitura das suas contas de anúncios. A conexão OAuth ainda está em desenvolvimento.', action: 'Ver integrações', path: '/dashboard/canais' },
  { id: 'sources', title: 'Escolher as fontes de dados', description: 'Selecione contas de anúncios e a propriedade GA4. Depende da conexão e da primeira sincronização.', action: 'Conhecer esta etapa', path: '/dashboard/recursos?grupo=crescimento' },
  { id: 'funnel', title: 'Organizar seu funil', description: 'Relacione campanhas, visitas e conversões. O mapeamento do funil ainda será implementado.', action: 'Ver o plano do funil', path: '/dashboard/recursos?grupo=gestao' },
  { id: 'insight', title: 'Receber a primeira análise', description: 'Revise uma análise baseada em dados sincronizados, com período e origem identificados.', action: 'Ver próximos recursos', path: '/dashboard/recursos?grupo=automacao' }
] as const
