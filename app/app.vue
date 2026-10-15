<script setup lang="ts">
import { MotionConfig } from 'motion-v'
import { pt_br } from '@nuxt/ui/locale'
const { effectiveTheme, initialize } = useInterfacePreferences()
let cleanupTheme: (() => void) | undefined
onMounted(() => { cleanupTheme = initialize() })
onBeforeUnmount(() => cleanupTheme?.())
useHead(() => ({
  htmlAttrs: { 'data-interface-theme': effectiveTheme.value, class: effectiveTheme.value },
  meta: [{ name: 'color-scheme', content: effectiveTheme.value }, { name: 'theme-color', content: effectiveTheme.value === 'light' ? '#f5f6f8' : '#090a0b' }]
}))
</script>
<template>
  <UApp :locale="pt_br"><MotionConfig reduced-motion="user">
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator color="#eaa176" />
    <NuxtLayout><NuxtPage /></NuxtLayout>
  </MotionConfig></UApp>
</template>
