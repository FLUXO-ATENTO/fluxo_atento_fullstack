export const socialProviders = ['google', 'github'] as const
export type SocialProvider = typeof socialProviders[number]

/** Explicit deployment gate: enabling a button never configures the provider. */
export function enabledSocialProviders(value: unknown): SocialProvider[] {
  if (typeof value !== 'string') return []
  const configured = value.split(',').map(item => item.trim())
  return socialProviders.filter(provider => configured.includes(provider))
}

export function socialAuthOptions(provider: SocialProvider, origin: string) {
  const url = new URL(origin)
  const local = ['localhost', '127.0.0.1'].includes(url.hostname)
  if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) throw new Error('Invalid auth origin')
  return { provider, options: { redirectTo: url.origin + '/auth/callback' } }
}
