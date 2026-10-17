<script setup lang="ts">
defineProps<{ compact?: boolean }>()
const { effectiveTheme } = useInterfacePreferences()
</script>
<template>
  <UModal :title="compact ? 'Tema' : 'Aparência do Fluxo Atento'" :description="compact ? 'Escolha entre tema claro, escuro ou do sistema.' : 'Escolha o tema mais confortável para você.'" :ui="{ content: compact ? 'workspace-dialog access-theme-dialog' : 'workspace-dialog' }">
    <button type="button" class="icon-button theme-menu-trigger" aria-label="Alterar aparência" :title="effectiveTheme === 'dark' ? 'Tema escuro · alterar aparência' : 'Tema claro · alterar aparência'"><UIcon :name="effectiveTheme === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'" aria-hidden="true" /></button>
    <template #body><InterfaceTheme :compact="compact" /><p v-if="!compact" class="field-help">O padrão é Escuro. Se preferir, escolha Claro ou Sistema. A preferência fica salva neste navegador, neste endereço. Em Sistema, o tema acompanha o seu dispositivo. Isso não altera sua conta nem suas permissões.</p></template>
  </UModal>
</template>
