<script setup lang="ts">
defineProps<{ compact?: boolean }>()
const { theme, setTheme } = useInterfacePreferences()
const groupId = useId()
</script>
<template>
  <fieldset class="theme-picker" :class="{ 'theme-picker-compact': compact }"><legend :class="{ 'sr-only': compact }">Aparência</legend>
    <label v-for="option in [{ value: 'light', label: 'Claro', icon: 'i-lucide-sun' }, { value: 'dark', label: 'Escuro', icon: 'i-lucide-moon' }, { value: 'system', label: 'Sistema', icon: 'i-lucide-monitor' }] as const" :key="option.value" :class="{ selected: theme === option.value }">
      <input type="radio" :name="groupId" :value="option.value" :checked="theme === option.value" @change="setTheme(option.value)"><UIcon :name="option.icon" aria-hidden="true" /><span>{{ option.label }}</span>
    </label>
  </fieldset>
</template>
