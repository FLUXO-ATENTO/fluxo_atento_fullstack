import { resolveTheme } from '~/utils/workspace-ui'

export function useInterfacePreferences() {
  // The brand is dark by default. Follow the device only after an explicit choice.
  const theme = useState<'light' | 'dark' | 'system'>('interface-theme', () => resolveTheme(null))
  const systemDark = useState('interface-system-dark', () => true)
  const initialized = useState('interface-theme-initialized', () => false)
  const effectiveTheme = computed(() => theme.value === 'system' ? (systemDark.value ? 'dark' : 'light') : theme.value)
  function setTheme(value: 'light' | 'dark' | 'system') {
    theme.value = value
    try { localStorage.setItem('fluxo-interface-theme', value) } catch { /* Preference still works for this session. */ }
  }
  // Called once by app.vue; every theme control shares the same reactive state.
  function initialize() {
    if (!initialized.value) {
      try { theme.value = resolveTheme(localStorage.getItem('fluxo-interface-theme')) } catch { /* Storage can be blocked. */ }
      initialized.value = true
    }
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => { systemDark.value = media.matches }
    update(); media.addEventListener('change', update)
    const sync = (event: StorageEvent) => {
      if (event.key === 'fluxo-interface-theme') theme.value = resolveTheme(event.newValue)
    }
    window.addEventListener('storage', sync)
    return () => { media.removeEventListener('change', update); window.removeEventListener('storage', sync) }
  }
  return { theme, effectiveTheme, setTheme, initialize }
}
