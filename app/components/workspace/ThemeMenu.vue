<script setup lang="ts">
defineProps<{ compact?: boolean }>()
const { theme, effectiveTheme, setTheme } = useInterfacePreferences()

const themeLabel = { light: 'Claro', dark: 'Escuro', system: 'Sistema' } as const
const themeIcon = { light: 'i-lucide-sun', dark: 'i-lucide-moon', system: 'i-lucide-monitor' } as const
const nextThemeValue = { dark: 'light', light: 'system', system: 'dark' } as const
const nextTheme = computed(() => nextThemeValue[theme.value])
const compactLabel = computed(() => `Tema ${themeLabel[theme.value]}. Clique para usar ${themeLabel[nextTheme.value]}.`)

function cycleTheme() {
  setTheme(nextTheme.value)
}
</script>
<template>
  <button v-if="compact" type="button" class="icon-button theme-menu-trigger" :aria-label="compactLabel" :title="compactLabel" @click="cycleTheme">
    <UIcon :name="themeIcon[theme]" aria-hidden="true" />
    <span class="sr-only" aria-live="polite">{{ compactLabel }}</span>
  </button>
  <UModal v-else title="Aparência do Fluxo Atento" description="Escolha o tema mais confortável para você." :ui="{ content: 'workspace-dialog' }">
    <button type="button" class="icon-button theme-menu-trigger" aria-label="Alterar aparência" :title="effectiveTheme === 'dark' ? 'Tema escuro · alterar aparência' : 'Tema claro · alterar aparência'"><UIcon :name="effectiveTheme === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'" aria-hidden="true" /></button>
    <template #body><InterfaceTheme /><p class="field-help">O padrão é Escuro. Se preferir, escolha Claro ou Sistema. A preferência fica salva neste navegador, neste endereço. Em Sistema, o tema acompanha o seu dispositivo. Isso não altera sua conta nem suas permissões.</p></template>
  </UModal>
</template>
