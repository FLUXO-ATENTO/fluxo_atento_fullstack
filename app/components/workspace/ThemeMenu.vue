<script setup lang="ts">
const { effectiveTheme } = useInterfacePreferences()
</script>
<template>
  <UModal title="Aparência do Fluxo Atento" description="Escolha o tema mais confortável para você." :ui="{ content: 'workspace-dialog' }">
    <button type="button" class="icon-button theme-menu-trigger" aria-label="Alterar aparência" :title="effectiveTheme === 'dark' ? 'Tema escuro · alterar aparência' : 'Tema claro · alterar aparência'"><UIcon :name="effectiveTheme === 'dark' ? 'i-lucide-moon' : 'i-lucide-sun'" aria-hidden="true" /></button>
    <template #body><InterfaceTheme /><p class="field-help">O padrão é Escuro. Se preferir, escolha Claro ou Sistema. A preferência fica salva neste navegador, neste endereço. Em Sistema, o tema acompanha o seu dispositivo. Isso não altera sua conta nem suas permissões.</p></template>
  </UModal>
</template>
